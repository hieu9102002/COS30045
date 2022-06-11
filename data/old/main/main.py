
import pandas as pd

DIRECTORY = ""
DIRECTORY = "https://raw.githubusercontent.com/thanhan910/Courseworks/main/Swinburne/COS30045/data/"

# sources
SOURCES = {
    "countries": {
        "data": {
            "json":  "countries/data.json",
            "csv": "countries/data.csv"
        },
        "info": {
            "json": "countries/info/info.json"
        },
    },
    "usstates": {
        "data": {
            "json": "usstates/data.json",
            "csv": "usstates/data.csv"
        },
        "info": {
            "json": "usstates/info/info.json",
            "csv": "usstates/info/info.csv"
        }
    },
    "tilegrid": {
        "links": "tilegrid/links.csv",
        "publication-grids": "tilegrid/publication-grids.csv"
    }
}

# load the countries datasets
# after using all four methods, it seems that csv files can be loaded faster
# when writing the dataframe to csv or json, it also seems that csv files use less storage
# df_countries_json = pd.read_json(SOURCES["countries"]["data"]["json"])
# df_countries_json
# df_countries_csv = pd.read_csv(SOURCES["countries"]["data"]["csv"])
# df_countries_csv
df_countries = pd.read_csv(DIRECTORY + SOURCES["countries"]["data"]["csv"])

# load the datasets
# after using all four methods, it seems that csv files can be loaded faster
# when writing the dataframe to csv or json, it also seems that csv files use less storage
# df_usstates_json = pd.read_json(SOURCES["usstates"]["data"]["json"])
# df_usstates_json
# df_usstates_csv = pd.read_csv(SOURCES["usstates"]["data"]["csv"])
# df_usstates_csv
df_usstates = pd.read_csv(DIRECTORY + SOURCES["usstates"]["data"]["csv"])

# selecting attributes 
# settings

COUNTRIES_NEEDED_YEARS = [2019]

COUNTRIES_NEEDED_ISO_CODES = [
    "USA",
    "DEU",
    "CAN",
    "FRA",
    "ESP",
    "MEX",
    "ITA",
    "GBR",
    "ARG",
    "BRA",
    "NLD",
    "POL",
    "SWE",
    "BEL",
    "AUS",
    "AUT",
    "THA",
    "OWID_EUR",
    "IND",
    "CHN",
    "PRT",
    "JPN",
    "HUN",
    "ROU",
    "BGR",
    "PAK",
    "ZAF",
    "TUR",
    "CHL",
    "PER",
    "NOR",
    "GRC",
    "DNK",
    "VNM",
    "BGD",
    "EGY",
    "IRL",
    "KOR",
    "ECU",
    "TWN",
    "PHL",
    "TUN",
    "BOL",
    "MNG",
    "BDI",
    "COL",
    "IDN",
    "IRN",
    "MYS",
]

COUNTRIES_NEEDED_VARIABLES = [
    "iso_code",
    "country",
    "year",
    "group_is_USA",
    "group_OWID_Continent",
    "group_WHO_Region",
    "group_WB_incomeLevel",
    "group_WB_lendingType",
    "area",
    "population",
    "gdp",
    "gdp_per_captia",
    "coal_production",
    "electricity_demand",
    "electricity_generation",
    "fossil_fuel_consumption",
    "gas_production",
    "greenhouse_gas_emissions",
    "oil_production",
]

USSTATES_NEEDED_YEARS = range(1960, 2020)

# filter datasets

df_countries = df_countries[
        COUNTRIES_NEEDED_VARIABLES
    ][
        df_countries["iso_code"].isin(COUNTRIES_NEEDED_ISO_CODES) 
        & 
        df_countries["year"].isin(COUNTRIES_NEEDED_YEARS)
    ]

df_usstates = df_usstates[df_usstates["Year"].isin(USSTATES_NEEDED_YEARS)]

df_countries.to_csv("countries_data.csv", index=False)
df_usstates.to_csv("usstates_data.csv", index=False)

# ## download info data

# pd.read_json(DIRECTORY + SOURCES["countries"]["info"]["json"],orient="index").agg(lambda x: x.dropna().to_dict(), axis=1).to_json("countries_info.json")

# pd.read_json(DIRECTORY + SOURCES["usstates"]["info"]["json"],orient="index").agg(lambda x: x.dropna().to_dict(), axis=1).to_json("usstates_info.json")

# ## download tile grid data

# pd.read_csv(DIRECTORY + SOURCES["tilegrid"]["links"]).to_csv("links.csv", index=False)

# pd.read_csv(DIRECTORY + SOURCES["tilegrid"]["publication-grids"]).to_csv("publication-grids.csv", index=False)
