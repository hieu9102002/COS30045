from fileinput import filename
import pandas as pd
import json

FILEJSON = "owid-energy-data.json"
FILECSV = "owid-energy-data.csv"

dfs = pd.read_csv(FILECSV)

df = dfs.drop(columns=["country"])

df = pd.melt(df, id_vars=["iso_code", "year"],
             var_name="attr", value_name="data")

df = df.dropna()


def year_analysis(df=df):

    def _temp(df: pd.DataFrame):
        for i in ["iso_code", "attr", "data"]:
            df[i] = df[i].drop_duplicates().count()
        return df

    df1 = df.copy(deep=True)
    df2 = df.copy(deep=True)
    df1 = df1.groupby("year").apply(lambda df: _temp(df)).drop_duplicates()
    df2 = df2.groupby("year").count()

    df2["count"] = df2["attr"]

    df2 = df2["count"]

    df = pd.merge(df1, df2, on="year")

    df.to_csv("df.csv")

    print(df.describe())


def country_analysis(df=df):

    def _temp(df: pd.DataFrame):
        for i in ["year", "attr", "data"]:
            df[i] = df[i].drop_duplicates().count()
        return df

    df1 = df.copy(deep=True)
    df2 = df.copy(deep=True)
    df1 = df1.groupby("iso_code").apply(lambda df: _temp(df)).drop_duplicates()
    df2 = df2.groupby("iso_code").count()

    df2["count"] = df2["attr"]

    df2 = df2["count"]

    df = pd.merge(df1, df2, on="iso_code")

    df.to_csv("dfiso.csv")

    print(df.describe())
    print(df)


def attr_analysis(df=df):

    def _temp(df: pd.DataFrame):
        for i in ["year", "iso_code", "data"]:
            df[i] = df[i].drop_duplicates().count()
        return df

    df1 = df.copy(deep=True)
    df2 = df.copy(deep=True)
    df1 = df1.groupby("attr").apply(lambda df: _temp(df)).drop_duplicates()
    df2 = df2.groupby("attr").count()

    df2["count"] = df2["iso_code"]

    df2 = df2["count"]

    df = pd.merge(df1, df2, on="attr")

    df.to_csv("dfattr.csv")

    print(df.describe())
    print(df)


def test_owid(df : pd.DataFrame = dfs):
    
    df = df[df["year"] == 2016]
    df = df[df["iso_code"].isin([
"USA",
"DEU",
"CAN",
"FRA",
# "ESP",
# "MEX",
# "ITA",
"GBR",
# "ARG",
# "BRA",
# "NLD",
# "POL",
# "SWE",
# "BEL",
# "AUS",
# "AUT",
# "THA",
"OWID_EUR",
"IND",
"CHN",
# "PRT",
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

    
    columns = df.columns.tolist()

    ncols = []

    for col in columns:
        if(col in ["year", "iso_code", "country"]):
            continue

        ncols.append({
            "name": col,
            "value": col
        })

    open("owidname.json", "w").write(json.dumps(ncols, indent=4, sort_keys=False))

    return df

test_owid()