"""Platform plugin registry - auto-scans platforms/ directory to load plugins"""
import importlib
import pkgutil
from typing import Dict, Type
from .base_platform import BasePlatform

_registry: Dict[str, Type[BasePlatform]] = {}


def register(cls: Type[BasePlatform]):
    """Decorator: register platform plugin"""
    _registry[cls.name] = cls
    return cls


def load_all():
    """Auto-scan and load all plugins under platforms/"""
    import platforms
    for finder, name, _ in pkgutil.iter_modules(platforms.__path__, platforms.__name__ + "."):
        try:
            importlib.import_module(f"{name}.plugin")
        except ModuleNotFoundError:
            pass


def get(name: str) -> Type[BasePlatform]:
    if name not in _registry:
        raise KeyError(f"Platform '{name}' is not registered. Registered platforms: {list(_registry.keys())}")
    return _registry[name]


def list_platforms() -> list:
    return [
        {"name": cls.name, "display_name": cls.display_name, "version": cls.version}
        for cls in _registry.values()
    ]
