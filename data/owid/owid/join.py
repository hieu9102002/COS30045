import pandas as pd

def join_regions():
    files = [
        "owid.csv",
        "united-nations.csv",
        "who-regions.csv",
        "world-bank.csv"
    ]

    dfs = pd.read_csv(files[0])

    for f in files[1:]:
        df = pd.read_csv(f)
        dfs = pd.merge(dfs, df, on="Code", how="outer")

    dfs.to_csv("regions.csv")
    print(dfs)

def join_again():
    df1 = pd.read_csv("wb.csv")
    df2 = pd.read_csv("regions.csv")
    df = pd.merge(df1, df2, on="iso_code")
    df.to_csv("regionsmerged.csv")
