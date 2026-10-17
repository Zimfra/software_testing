"""The fixture-environment control for Python test code, and the Git containment it protects.

A test that spawns a child with the caller's environment acts on whatever repository inherited
GIT_* variables name: the hooked repository when the pre-push hook runs the tests from a linked
worktree (wiki lesson "Hook-run checks must preserve Git state"). So every child process in these
tests passes an env built by run_comply.isolated_env, which keeps no Git routing or configuration.
scripts/toolchain/fixture-env.test.ts is the TypeScript twin.
"""

import ast
import os
import subprocess
import tempfile
import unittest
from pathlib import Path
from typing import Callable
from unittest import mock

import run_comply

HERE = Path(__file__).resolve().parent
MODULES = {"subprocess", "os"}
SUBPROCESS_SPAWNERS = {"run", "Popen", "call", "check_call", "check_output", "getoutput", "getstatusoutput"}
OS_SPAWNERS = {"system", "popen", "posix_spawn", "posix_spawnp"}
# The decoy control below must inherit the caller's environment to show the hazard; this is the one
# function the check skips, and only in this file.
UNSAFE_CONTROLS = {("test_fixture_env.py", "unsafe_run")}


def is_spawner(module: str, name: str) -> bool:
    if module == "subprocess":
        return name in SUBPROCESS_SPAWNERS
    return name in OS_SPAWNERS or name.startswith(("exec", "spawn"))


def refers_to_spawner(node: ast.expr, names: set[str], modules: dict[str, str]) -> bool:
    if isinstance(node, ast.Name):
        return node.id in names
    return (isinstance(node, ast.Attribute) and isinstance(node.value, ast.Name)
            and node.value.id in modules and is_spawner(modules[node.value.id], node.attr))


def spawner_names(tree: ast.Module) -> tuple[set[str], dict[str, str]]:
    """Names bound to a spawner (imported, renamed, or aliased by assignment) and module aliases."""
    names: set[str] = set()
    modules: dict[str, str] = {}
    for node in ast.walk(tree):
        if isinstance(node, ast.Import):
            modules.update({alias.asname or alias.name: alias.name for alias in node.names if alias.name in MODULES})
        elif isinstance(node, ast.ImportFrom) and node.module in MODULES:
            names.update(alias.asname or alias.name for alias in node.names if is_spawner(node.module, alias.name))
    assignments = [node for node in ast.walk(tree) if isinstance(node, ast.Assign)]
    size = -1
    while size != len(names):
        size = len(names)
        for node in assignments:
            if refers_to_spawner(node.value, names, modules):
                names.update(target.id for target in node.targets if isinstance(target, ast.Name))
    return names, modules


def is_isolated_env_call(node: ast.expr) -> bool:
    if not isinstance(node, ast.Call):
        return False
    func = node.func
    return (isinstance(func, ast.Name) and func.id == "isolated_env") or (isinstance(func, ast.Attribute) and func.attr == "isolated_env")


SCOPES = (ast.Module, ast.FunctionDef, ast.AsyncFunctionDef, ast.ClassDef)


def own_nodes(scope: ast.AST) -> list[ast.AST]:
    """The nodes of `scope`, not those of the functions and classes nested in it."""
    found: list[ast.AST] = []
    pending = list(ast.iter_child_nodes(scope))
    while pending:
        node = pending.pop()
        found.append(node)
        if not isinstance(node, SCOPES):
            pending.extend(ast.iter_child_nodes(node))
    return found


def isolated_bindings(scope: ast.AST) -> dict[str, bool]:
    """For each name `scope` assigns: whether every one of its assignments there is an isolated_env call."""
    bound: dict[str, bool] = {}
    for node in own_nodes(scope):
        if isinstance(node, ast.Assign):
            for target in node.targets:
                if isinstance(target, ast.Name):
                    bound[target.id] = bound.get(target.id, True) and is_isolated_env_call(node.value)
    return bound


def is_isolated_name(name: str, scopes: list[ast.AST]) -> bool:
    """The nearest enclosing scope that assigns `name` decides, as Python's own lookup does."""
    for scope in scopes:
        bound = isolated_bindings(scope)
        if name in bound:
            return bound[name]
    return False


def passes_clean_env(call: ast.Call, scopes: list[ast.AST]) -> bool:
    return any(keyword.arg == "env" and (is_isolated_env_call(keyword.value)
                                          or (isinstance(keyword.value, ast.Name) and is_isolated_name(keyword.value.id, scopes)))
               for keyword in call.keywords)


def loads_spawner_module_dynamically(call: ast.Call) -> bool:
    func = call.func
    loader = (isinstance(func, ast.Name) and func.id == "__import__") or (isinstance(func, ast.Attribute) and func.attr == "import_module")
    first = call.args[0] if call.args else None
    return loader and isinstance(first, ast.Constant) and first.value in MODULES


def exempt_lines(tree: ast.Module, path: str) -> set[int]:
    lines: set[int] = set()
    for node in ast.walk(tree):
        if isinstance(node, ast.FunctionDef) and (Path(path).name, node.name) in UNSAFE_CONTROLS:
            lines.update(range(node.lineno, (node.end_lineno or node.lineno) + 1))
    return lines


def calls_with_scopes(tree: ast.Module) -> list[tuple[ast.Call, list[ast.AST]]]:
    """Every call, with its enclosing scopes from the innermost out to the module."""
    found: list[tuple[ast.Call, list[ast.AST]]] = []
    pending: list[tuple[ast.AST, list[ast.AST]]] = [(tree, [tree])]
    while pending:
        node, scopes = pending.pop()
        for child in ast.iter_child_nodes(node):
            inner = [child, *scopes] if isinstance(child, SCOPES) else scopes
            if isinstance(child, ast.Call):
                found.append((child, scopes))
            pending.append((child, inner))
    return found


def unscrubbed_spawns(path: str, source: str) -> list[str]:
    tree = ast.parse(source, filename=path)
    names, modules = spawner_names(tree)
    exempt = exempt_lines(tree, path)
    found = []
    for call, scopes in calls_with_scopes(tree):
        if call.lineno in exempt:
            continue
        if (refers_to_spawner(call.func, names, modules) and not passes_clean_env(call, scopes)) or loads_spawner_module_dynamically(call):
            found.append(f"{path}:{call.lineno}")
    return sorted(found, key=lambda entry: int(entry.rsplit(":", 1)[1]))


class SpawnCheck(unittest.TestCase):
    def test_sees_through_renames_and_aliases_and_accepts_only_an_isolated_env(self) -> None:
        offending = [
            "import subprocess\nsubprocess.run(['git', 'init'])",
            # The A02 omission: a setup callback that hands the caller's environment to every command.
            "import subprocess\nrun = lambda args, **kw: subprocess.run(args, **kw)",
            "import subprocess as sp\nsp.Popen(['sh', '-c', 'git init'])",
            "from subprocess import check_output as co\nco(['git', 'status'])",
            "import os, subprocess\nsubprocess.run(args, env=os.environ)",
            "import os, subprocess\nsubprocess.run(args, env=dict(os.environ))",
            "import os, subprocess\nenv = dict(os.environ)\nsubprocess.run(args, env=env)",
            "import os, subprocess, run_comply\nenv = run_comply.isolated_env(b, g)\nenv = dict(os.environ)\nsubprocess.run(args, env=env)",
            "import subprocess\nrun = subprocess.run\nagain = run\nagain(['git'])",
            "import os\nos.system('git init')",
            "from os import execvp\nexecvp('git', ['git'])",
            "import subprocess\nsubprocess.getoutput('git status')",
            "import importlib\nimportlib.import_module('subprocess')",
            "__import__('os')",
            "import subprocess\ndef unsafe_run(args):\n    return subprocess.run(args)",
            "import os, subprocess, run_comply\ndef a():\n    env = dict(os.environ)\n    subprocess.run(x, env=env)\n"
            "def b():\n    env = run_comply.isolated_env(o, g)\n    subprocess.run(x, env=env)",
        ]
        for source in offending:
            self.assertEqual(len(unscrubbed_spawns("sample.py", source)), 1, source)
        clean = [
            "import os, subprocess, run_comply\nsubprocess.run(args, env=run_comply.isolated_env(dict(os.environ), g))",
            "import os, subprocess, run_comply\nenv = run_comply.isolated_env(dict(os.environ), g)\nrun = lambda args, **kw: subprocess.run(args, env=env, **kw)",
            "from run_comply import isolated_env\nimport subprocess\nsubprocess.Popen(cmd, env=isolated_env(base, g))",
            "import os\nos.path.join('a', 'b')",
            "import subprocess, run_comply\ndef t():\n    env = run_comply.isolated_env(o, g)\n"
            "    def inner():\n        return subprocess.run(x, env=env)",
        ]
        for source in clean:
            self.assertEqual(unscrubbed_spawns("sample.py", source), [], source)

    def test_every_child_process_spawned_by_these_tests_passes_an_isolated_env(self) -> None:
        offenders = [found for path in sorted(HERE.glob("test_*.py"))
                     for found in unscrubbed_spawns(path.name, path.read_text())]
        self.assertEqual(offenders, [])


def untainted() -> dict[str, str]:
    return {key: value for key, value in os.environ.items() if not key.startswith("GIT_")}


def tree_state(root: Path) -> dict[str, tuple[int, bytes]]:
    """Mode and content of every path under `root`: HEAD, refs, config, index and working files alike."""
    state = {}
    for path in sorted(root.rglob("*")):
        content = os.readlink(path).encode() if path.is_symlink() else path.read_bytes() if path.is_file() else b""
        state[path.relative_to(root).as_posix()] = (path.lstat().st_mode, content)
    return state


def make_decoy(root: Path) -> Path:
    decoy = root / "decoy"
    decoy.mkdir()
    env = run_comply.isolated_env(untainted(), root / "gh")
    git = lambda *args: subprocess.run(["git", *args], cwd=decoy, env=env, check=True, capture_output=True)
    git("init", "--quiet")
    (decoy / "tracked.txt").write_text("decoy\n")
    git("add", "tracked.txt")
    git("commit", "--quiet", "-m", "decoy")
    return decoy


def decoy_routing(decoy: Path) -> dict[str, str]:
    """What a hook or a parent session can leave in the environment: routing plus injected configuration."""
    return {
        "GIT_DIR": str(decoy / ".git"), "GIT_WORK_TREE": str(decoy), "GIT_INDEX_FILE": str(decoy / ".git" / "index"),
        "GIT_CONFIG_COUNT": "1", "GIT_CONFIG_KEY_0": "fixture.injected", "GIT_CONFIG_VALUE_0": "count",
        "GIT_CONFIG_PARAMETERS": "'fixture.parameter'='parameters'",
    }


SETUP = ("git config fixture.marker set", "printf 'made\\n' > made.txt", "git add made.txt",
         "git config --get-regexp '^fixture[.]' > seen.txt; true")


def unsafe_run(args: list[str], **kwargs: object) -> object:
    """The callback A02 found: the caller's environment, so inherited routing reaches the decoy."""
    return subprocess.run(args, **kwargs)  # type: ignore[call-overload]


class DecoyContainment(unittest.TestCase):
    def setup_under_decoy_routing(self, root: Path, run_for: Callable[[], Callable[..., object]]) -> list[str]:
        messages: list[str] = []
        with mock.patch.dict(os.environ, {**untainted(), **decoy_routing(root / "decoy")}, clear=True):
            run = run_for()
            run_comply.setup_sandbox(root / "box", SETUP, run, messages.append)
            run_comply.commit_baseline(root / "box", run)
        return messages

    def test_the_caller_s_environment_lets_setup_reach_a_decoy_named_by_inherited_routing(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            before = tree_state(make_decoy(root))
            try:
                self.setup_under_decoy_routing(root, lambda: unsafe_run)
            except subprocess.CalledProcessError:
                pass  # the baseline may refuse once routing has pointed it elsewhere; the decoy is what matters
            self.assertNotEqual(tree_state(root / "decoy"), before, "the unsafe callback is a real control: it reaches the decoy")

    def test_an_isolated_env_initialises_the_fixture_and_leaves_the_decoy_unchanged(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            before = tree_state(make_decoy(root))

            def isolated() -> Callable[..., object]:
                env = run_comply.isolated_env(dict(os.environ), root / "gh")
                return lambda args, **kw: subprocess.run(args, env=env, **kw)

            messages = self.setup_under_decoy_routing(root, isolated)
            self.assertEqual(tree_state(root / "decoy"), before, "HEAD, refs, config, index and files of the decoy are unchanged")
            self.assertEqual(messages, [], "every setup command succeeded in the fixture")
            box_env = run_comply.isolated_env(untainted(), root / "gh")
            git = lambda *args: subprocess.run(["git", *args], cwd=root / "box", env=box_env, check=True, capture_output=True, text=True).stdout.strip()
            self.assertEqual(git("config", "--get", "fixture.marker"), "set")
            self.assertEqual(git("ls-files"), "made.txt\nseen.txt")
            self.assertEqual((root / "box" / "seen.txt").read_text(), "fixture.marker set\n", "injected configuration is dropped")
            self.assertEqual(git("rev-parse", "HEAD"), git("rev-parse", "refs/remotes/origin/main"))


if __name__ == "__main__":
    unittest.main()
