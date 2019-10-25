"""
Execute in maya to get the list of availabe commands.

>>> import sys
>>> sys.path.append(path_to_file)
>>> import list_cmds
>>> list_cmds.write_cmds_to_json()
"""

import json
import os

from maya import cmds, mel


def build_cmds_data():
    cmds_data = {}
    type_data = {}
    next_type = 0
    for c in dir(cmds):
        if callable(getattr(cmds, c)):
            typ = mel.eval('whatIs {}'.format(c))
            
            if typ not in type_data:
                type_data[typ] = next_type
                next_type += 1

            cmds_data[c] = type_data[typ]
    return {
        'cmds': cmds_data,
        'type': type_data
        }


def write_cmds_to_json():
    with open(os.path.join(os.path.dirname(__file__), 'working', 'cmds.json'), mode='w') as f:
        json.dump(build_cmds_data(), f, indent=4)
