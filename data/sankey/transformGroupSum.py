import time

NOW = time.time()
COUNT = 0

def clock_duration():
    now = time.time()

    global NOW
    global COUNT
    
    duration = now - NOW

    COUNT += 1
    NOW = time.time()
    return duration


import json

import numpy as np
import pandas as pd
from collections import defaultdict


# FILE_SANKEY = "sankey.xlsx"

# DF_SANKEY = pd.read_excel(FILE_SANKEY, sheet_name=['Nodes', 'Links', 'MSN', 'Group', 'GroupSum'])


def transformGroupSum(DF_GROUPSUM : pd.DataFrame):

    tree_childs_of = DF_GROUPSUM.groupby(["parent"])["child"].apply(list)

    tree_parents_of = DF_GROUPSUM.groupby(["child"])["parent"].apply(list)


    # def get_descendants(parent, tree):
    #     result = []

    #     if(tree.get(parent) == None):
    #         return result
            
    #     result += tree[parent]

    #     for child in tree[parent]:
    #         result += get_descendants(child, tree)

    #     result = list( dict.fromkeys(result) )
        
    #     return result


    def get_all_descendants(tree):

        descendants = {}

        def _get_descendants(parent, tree):

            if(tree.get(parent) == None):
                return []

            result = [] + tree[parent]

            for child in tree[parent]:
                if(descendants.get(child) == None):
                    result += _get_descendants(child, tree)
                else:
                    result += descendants[child]

            result = list( dict.fromkeys(result) )
            
            return result

        for parent in tree.index:
            descendants[parent] = [] + _get_descendants(parent=parent, tree=tree)

        return descendants


    data_descendants_of = get_all_descendants(tree=tree_childs_of)

    data_leafs_of = {
        parent : list(filter( lambda child: tree_childs_of.get(child) == None, childs ))
        for parent, childs in data_descendants_of.items()
    }

    data_ancestors_of = get_all_descendants(tree=tree_parents_of)


    def writejson(object, file):
        open(file, "w").write(json.dumps(object, indent="\t", sort_keys=False))

    writejson(data_descendants_of, "sankey_groups_descendants_of.json")
    writejson(data_leafs_of, "sankey_groups_leafs_of.json")
    writejson(data_ancestors_of, "sankey_groups_ancestors_of.json")

    return {
        "leafs_of": data_leafs_of,
        "descendants_of": data_descendants_of,
        "ancestors_of": data_ancestors_of,
    }

# filtergroups(DF_SANKEY["GroupSum"])