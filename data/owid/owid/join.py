import pandas as pd
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
