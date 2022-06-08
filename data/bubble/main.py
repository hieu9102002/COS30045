import pandas as pd
from pyparsing import col
import world_bank_data as wb
import weo

df_entities = pd.read_csv("entities/entities.csv")

WB_to_Code = df_entities[["WB", "Code"]].dropna(
).set_index("WB").to_dict(orient="index")
OWID_to_Code = df_entities[["OWID", "Code"]].dropna(
).set_index("OWID").to_dict(orient="index")


def create_df_owid(source):

    df = pd.read_csv(source)

    df = df.melt(id_vars=["iso_code", "country", "year"],
                 var_name="attr", value_name="owid")

    return df[["iso_code", "year", "attr", "owid"]]


def load_owid_data():

    df_owid_energy_data = create_df_owid(
        "https://raw.githubusercontent.com/owid/energy-data/master/owid-energy-data.csv")

    # df_owid_co2_data = create_df_owid(
    #     "https://raw.githubusercontent.com/owid/co2-data/master/owid-co2-data.csv")

    # df = pd.merge(df_owid_energy_data, df_owid_co2_data, on=["iso_code", "year", "attr"], how="outer")

    df = df_owid_energy_data

    # df.to_csv("df_owid_1.csv")

    df = df[["iso_code", "year", "attr", "owid"]].dropna()

    df["iso_code"] = df["iso_code"].transform(
        lambda x: OWID_to_Code[x]["Code"])
    df["year"] = df["year"].transform(lambda x: int(x))

    return df

# GDP per capita, PPP (current international $)	NY.GDP.PCAP.PP.CD
# GDP per capita (current US$)	NY.GDP.PCAP.CD


def load_wb_data():

    KEYS_WB = {
        "area": "AG.LND.TOTL.K2",
        "population": "SP.POP.TOTL",
        "gdp": "NY.GDP.MKTP.CD",
        "gdp_ppp": "NY.GDP.MKTP.PP.CD",
        "gdp_per_captia": "NY.GDP.PCAP.CD",
        "gdp_ppp_per_capita": "NY.GDP.PCAP.PP.CD",
    }

    ATTR = {v: k for k, v in KEYS_WB.items()}

    dfs = []

    for attr in KEYS_WB:
        df: pd.Series = wb.get_series(KEYS_WB[attr], id_or_value="id")

        df.index = df.index.reorder_levels(order=["Country", "Year", "Series"])
        df.index.rename(["iso_code", "year", "attr"], inplace=True)

        dfs.append(df)

    dfs = pd.concat(dfs)

    dfs = dfs.to_frame(name="wb")

    dfs.reset_index(inplace=True)

    dfs = dfs.dropna()

    dfs["attr"] = dfs["attr"].transform(lambda x: ATTR[x])

    dfs["iso_code"] = dfs["iso_code"].transform(
        lambda x: WB_to_Code[x]["Code"])

    dfs["year"] = dfs["year"].transform(lambda x: int(x))

    dfs = dfs[["iso_code", "year", "attr", "wb"]]

    return dfs


def load_and_integrate_data(stored=True):
    if(stored):
        df_owid = pd.read_csv("temp/df_owid.csv")
        df_wb = pd.read_csv("temp/df_wb.csv")
    else:
        df_owid = load_owid_data()
        df_wb = load_wb_data()
        df_owid.to_csv("temp/df_owid.csv")
        df_wb.to_csv("temp/df_wb.csv")

    df = pd.merge(df_owid, df_wb, on=["iso_code", "year", "attr"], how="outer")
    df.to_csv("data.csv")
    df["value"] = df["wb"].fillna(df["owid"])
    df = df[["iso_code", "year", "attr", "value"]]
    return df


def load_groups_data():
    keys = {
        "iso_code": "Code",
        "country": "Entity",
        "group_OWID_Continent": "OWID_Continent",
        "group_UN_Region": "OWID_UN_Region",
        "group_WHO_Region": "OWID_WHO_Region",
        "group_WB_region": "WB_region",
        "group_WB_adminregion": "WB_adminregion",
        "group_WB_incomeLevel": "WB_incomeLevel",
        "group_WB_lendingType": "WB_lendingType",
        "group_WB_longitude": "WB_longitude",
        "group_WB_latitude": "WB_latitude"
    }

    keys_group = [
        "group_OWID_Continent",
        "group_UN_Region",
        "group_WHO_Region",
        "group_WB_region",
        "group_WB_adminregion",
        "group_WB_incomeLevel",
        "group_WB_lendingType"]

    df_groups = pd.DataFrame()

    for k in keys:
        df_groups[k] = df_entities[keys[k]]

    # add us

    # df_groups.set_index("iso_code")

    for k in keys_group:

        df_groups[k + "_exclude_US"] = df_groups[k]

        df_groups.loc[df_groups["country"] == "United States", k + "_exclude_US"] = "United States"


    df_groups["group_is_USA"] = df_groups["country"].copy(deep=True).transform(lambda x: x if x == "United States" else "Other Entities")
    
    return df_groups
        


def main():

    df = load_and_integrate_data()

    df_groups = load_groups_data()

    df = df.pivot(index=["iso_code", "year"],
                  columns="attr", values="value").reset_index()

    df = pd.merge(df, df_groups, on="iso_code", how="left")

    df = df[df["iso_code"].isin(
        [
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
    )
    ]

    df = df[df["year"].isin([2019])]

    df.to_json("owid.json", orient="records")


main()
