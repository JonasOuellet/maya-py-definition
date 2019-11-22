# Maya Python Cmds Definiton

This provide **advance** python definition for the `maya.cmds` modules.

* keyword args auto complete
* keyword args type
* keyword args documentation directly in the IDE
* function documentation directly in the IDE

## Installation

To use this, you should set up your development environment to include Maya completion located here `{maya_folder}/devkit/other/pymel/extras/completion/py` and to use the interpreter located here `{maya_folder}/bin/mayapy`.

Download [out/cmds/\_\_init\_\_.py](https://raw.githubusercontent.com/JonasOuellet/maya-py-definition/master/out/cmds/__init__.py) and replace the file located here `{maya_folder}/devkit/other/pymel/extras/completion/py/maya/cmds`

If you are using **Pycharm** you can use [out/cmds/\_\_init\_\_.pyi](https://raw.githubusercontent.com/JonasOuellet/maya-py-definition/master/out/cmds/__init__.pyi).  This will provide advanced typing.
Delete or rename the old `__init__.py` file.  

*Note:* Since this is a big file, Pycharm will probably ask you to increase the available memory.

### Example of function definition:

```python
def lookThru(*args, farClip=0.0, nearClip=0.0, q=True, query=True, **kwargs):
    """
    This command sets a particular camera to look through in a view  This command may also be
    used to view the negative z axis of lights or other DAG objects  The standard camera tools
    can then be used to place the object   Note: if there are multiple objects under the
    transform selected, cameras and lights take precedence
    
    :param farClip: (C) Used when setting clip far plane for a new look thru camera  Will not
    affect the attributes of an existing camera  Clip values must come before shape
    :type farClip: float
    :param nearClip: (C) Used when setting near clip plane for a new look thru camera  Will not
    affect the attributes of an existing camera  Clip values must come before shap
    :type nearClip: float
    
    :returns: 
    :rtype: None
    """
    pass
```
