import json
import pandas as pd
from collections import defaultdict

# filenames
FILE_DATASET = "complete_seds.csv"
FILE_MSN = "msn.csv"
FILE_STATECODE = "statecode.csv"



# select needed msn
RENEWABLE_MSN = {
    'GETCB': "Geothermal",
    'BMTCB': "Biomass",
    'HYTCB': "Hydropower",
    'SOTCB': "Solar",
    'WYTCB': "Wind",
}

NEEDED_MSN = {
    'GETCB': "Geothermal",
    'BMTCB': "Biomass",
    'HYTCB': "Hydropower",
    'SOTCB': "Solar",
    'WYTCB': "Wind",
    'RETCB': "TotalRenewable",
    'TETCB': "TotalPrimary"
}

# select needed years
NEEDED_YEARS = range(2000, 2020)

# read data
DF_DATASET = pd.read_csv(FILE_DATASET, usecols=["StateCode", "Year", "MSN", "Data"])

# filter dataset
DF_DATASET = DF_DATASET[DF_DATASET["Year"].isin(NEEDED_YEARS) & DF_DATASET["MSN"].isin(NEEDED_MSN.keys())]
DF_DATASET["MSN"] = DF_DATASET["MSN"].transform(lambda x: NEEDED_MSN[x])
DF_DATASET["Data"] = DF_DATASET["Data"].transform(lambda x: float(x))

# add other renewables data

# pivot data
DF_DATASET = DF_DATASET.pivot(index=["StateCode", "Year"], columns=["MSN"], values=["Data"])["Data"]

# change to normal dataframe
# https://stackoverflow.com/questions/43756052/transform-pandas-pivot-table-to-regular-dataframe
DF_DATASET = pd.DataFrame(DF_DATASET.to_records())

# add other renewables data
DF_DATASET['OtherRenewables'] = DF_DATASET['TotalRenewable'] - DF_DATASET[list(RENEWABLE_MSN.values())].sum(axis=1)

# add non renewable data
DF_DATASET['NonRenewables'] = DF_DATASET['TotalPrimary'] - DF_DATASET['TotalRenewable']

# unpivot data
DF_DATASET= pd.melt(frame=DF_DATASET, id_vars=["StateCode", "Year"], var_name="MSN", value_name="Data")

# clear negative values
DF_DATASET["Data"] = DF_DATASET["Data"].transform(lambda x: 0 if x < 0 else x)


# reformat data

# transform to dict

data = DF_DATASET.groupby(["StateCode", "Year", "MSN"])["Data"].sum().to_dict()

# transform tuple key to nested dict
DATA = defaultdict(lambda: defaultdict(dict))
for key, value in data.items():
    state, year, msn = key
    DATA[state][year]["year"] = year
    DATA[state][year][msn] = value


# reformat data

FORMATTED_DATA = { 
    "data" : [
        { 
            "code": state,
            "years": [DATA[state][year] for year in DATA[state].keys()]
        } 
        for state in DATA.keys()
    ] 
}



open("transformed.json", "w").write(json.dumps(FORMATTED_DATA, sort_keys=False, indent='\t'))
