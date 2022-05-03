#  get needed msn

import pandas as pd
import json

# parameter
FILE_DESCRIPTION = "Codes_and_Descriptions.csv"

# read data
DF_DESCRIPTIONS = pd.read_csv(FILE_DESCRIPTION, encoding='unicode_escape')

# descriptions and its future name in the reformatted data
NEEDED_DESCRIPTIONS = {
    'Geothermal energy total consumption': "Geothermal",
    'Biomass total consumption': "Biomass",
    'Hydropower total consumption': "Hydropower",
    'Solar energy total consumption': "Solar",
    'Wind energy total consumption': "Wind",
    'Renewable energy total consumption': "TotalRenewable",
    'Total energy consumption': "TotalPrimary"
}

# select all msn with fitted descriptions
DESCRIPTIONS = DF_DESCRIPTIONS[DF_DESCRIPTIONS["Description"].isin(NEEDED_DESCRIPTIONS.keys())].set_index("MSN").to_dict("index")

# create a new dict
NEEDED_MSN = {msn : NEEDED_DESCRIPTIONS[value["Description"]] for msn, value in DESCRIPTIONS.items() }

# return dict
# write to json
open("MSN_to_name.json", "w").write(json.dumps(NEEDED_MSN, sort_keys=False, indent='\t'))