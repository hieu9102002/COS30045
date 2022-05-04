import json
import pandas as pd
from collections import defaultdict

# filenames
FILE_DATASET = "complete_seds.csv"
FILE_MSN = "msn.csv"
FILE_STATECODE = "statecode.csv"

# selected msn
SELECTED_MSN = {
    "WDTCB": "Wood",
    "WSTCB": "Waste",
    "WWTCB": "WoodAndWaste",
    "BFTCB": "Biofuels",
    "BMTCB": "Biomass",
    "SOTCB": "Solar",
    "WYTCB": "Wind",
    "GETCB": "Geothermal",
    "HYTCB": "Hydropower",
    "RETCB": "TotalRenewable",
    "PMTCB": "Petroleum",
    "NNTCB": "NaturalGas",
    "CLTCB": "Coal",
    "CCNIB": "CoalCokeNetImport",
    "FFTCB": "TotalFossilFuel",
    "NUETB": "Nuclear",
    "ELEXB": "ElectricityExport",
    "ELIMB": "ElectricityImport",
    "TETCB": "TotalConsumption"
}

# select needed msn
RENEWABLE_MSN = {
    'GETCB': "Geothermal",
    'BMTCB': "Biomass",
    'HYTCB': "Hydropower",
    'SOTCB': "Solar",
    'WYTCB': "Wind",
}

FOSSIL_FUEL_MSN = {
    
    "PMTCB": "Petroleum",
    "NNTCB": "NaturalGas",
    "CLTCB": "Coal"
}

# select needed msn
NEEDED_MSN = {

    "RETCB": "TotalRenewable",

    "FFTCB": "TotalFossilFuel",
    "CCNIB": "CoalCokeNetImport",

    "NUETB": "Nuclear",
    
    "ELEXB": "ElectricityExport",
    "ELIMB": "ElectricityImport",
    
    "TETCB": "TotalConsumption",

}
NEEDED_MSN.update(RENEWABLE_MSN)
NEEDED_MSN.update(FOSSIL_FUEL_MSN)

print(NEEDED_MSN.keys())

# select needed years
NEEDED_YEARS = range(2000, 2020)

# ----------------------------------------------------------------------------------------------------------------
# READ AND FILTER DATA
# ----------------------------------------------------------------------------------------------------------------

# read data
DF_DATASET = pd.read_csv(FILE_DATASET, usecols=["StateCode", "Year", "MSN", "Data"])

# filter dataset
DF_DATASET = DF_DATASET[DF_DATASET["Year"].isin(NEEDED_YEARS) & DF_DATASET["MSN"].isin(NEEDED_MSN.keys())]
DF_DATASET["MSN"] = DF_DATASET["MSN"].transform(lambda x: NEEDED_MSN[x])
DF_DATASET["Data"] = DF_DATASET["Data"].transform(lambda x: float(x))

# ----------------------------------------------------------------------------------------------------------------
# ADD DATA
# ----------------------------------------------------------------------------------------------------------------

# pivot dataframe
DF_DATASET = DF_DATASET.pivot(index=["StateCode", "Year"], columns=["MSN"], values=["Data"])["Data"]

# change to normal dataframe
# https://stackoverflow.com/questions/43756052/transform-pandas-pivot-table-to-regular-dataframe
DF_DATASET = pd.DataFrame(DF_DATASET.to_records())

# we add net coal coke import to total coal consumption
DF_DATASET["Coal"] = DF_DATASET["Coal"] + DF_DATASET["CoalCokeNetImport"]


DF_DATASET["TotalRenewable"] = DF_DATASET[ list(RENEWABLE_MSN.values()) ].sum(axis=1)

DF_DATASET["TotalFossilFuel"] = DF_DATASET[ list(FOSSIL_FUEL_MSN.values()) ].sum(axis=1)

DF_DATASET["TotalConsumption"] = DF_DATASET["TotalRenewable"] + DF_DATASET["TotalFossilFuel"] + DF_DATASET["Nuclear"]


# unpivot data
DF_DATASET= pd.melt(frame=DF_DATASET, id_vars=["StateCode", "Year"], var_name="MSN", value_name="Data")

# ----------------------------------------------------------------------------------------------------------------
# REFORMAT DATA
# ----------------------------------------------------------------------------------------------------------------

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

# write data to file
open("transformed.json", "w").write(json.dumps(FORMATTED_DATA, sort_keys=False, indent='\t'))
