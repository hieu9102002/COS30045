import pandas as pd

df_energy_data = pd.read_csv("owid-energy-data.csv")
df_land_area = pd.read_csv("land-area.csv")
df_regions = pd.read_csv("regions.csv")

df = pd.merge(df_energy_data, df_land_area, on=["iso_code", "year"])

df = pd.merge(df, df_regions, on=["iso_code"])

df["gdp_per_capita"] = df["gdp"] / df["population"]

df = df[df["year"] == 2019]

df = df[df["iso_code"].isin([
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
        # "HUN",
        # "ROU",
        # "BGR",
        # "PAK",
        # "ZAF",
        # "TUR",
        # "CHL",
        # "PER",
        # "NOR",
        # "GRC",
        # "DNK",
        "VNM",
        # "BGD",
        # "EGY",
        # "IRL",
        # "KOR",
        # "ECU",
        # "TWN",
        # "PHL",
        # "TUN",
        # "BOL",
        # "MNG",
        # "BDI",
        # "COL",
        # "IDN",
        # "IRN",
        # "MYS",
        ])]

df.to_json("owid.json", orient="records", indent=4)

print(df)