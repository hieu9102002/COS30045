import pandas as pd
import os
import world_bank_data as wb
import weo

def inspect_iso_from_owid_regions_data(tocsv=False):
    # https://ourworldindata.org/world-region-map-definitions

    directory = "owid"
    datafiles = []

    for dirpath, _, filenames in os.walk(directory):
        for f in filenames:
            datafiles.append(os.path.join(dirpath, f))

    dfs = []

    for f in datafiles:
        df = pd.read_csv(f).drop('Year', axis=1)
        dfs.append(df)

    df_merged = dfs[0]

    for df in dfs[1:]:
        df_merged = pd.merge(df_merged, df, on=["Entity", "Code"], how="outer")

    if(tocsv):
        df_merged.to_csv("owid.csv")

    return df_merged


def inspect_iso_code_from_other_owid_datasets():
    df = pd.read_csv(
        "https://raw.githubusercontent.com/owid/energy-data/master/owid-energy-data.csv")

    df = df[["iso_code", "country"]].drop_duplicates()

    df_owid_energy_data = df.set_index(["iso_code", "country"])

    df = pd.read_csv(
        "https://raw.githubusercontent.com/owid/co2-data/master/owid-co2-data.csv")
    df = df[["iso_code", "country"]].drop_duplicates()

    df_owid_co2_data = df.set_index(["iso_code", "country"])

    df_owid_data = pd.merge(df_owid_energy_data, df_owid_co2_data,
                            how="outer", left_index=True, right_index=True)

    df = pd.read_csv(
        "https://raw.githubusercontent.com/owid/energy-data/master/scripts/input/shared/iso_codes.csv")

    df = df.drop_duplicates(subset="iso_code")

    df.rename(columns={'Country': 'country'}, inplace=True)

    df_owid_country = df.set_index(["iso_code", "country"])

    df_owid = pd.merge(df_owid_data, df_owid_country, how="outer",
                       left_index=True, right_index=True)

    return df_owid


def merge_all_owid_data():
    df_owid = inspect_iso_code_from_other_owid_datasets().reset_index()
    df_owid.rename(columns={'country': 'Entity',
                   'iso_code': 'Code'}, inplace=True)
    df_merged = inspect_iso_from_owid_regions_data()
    df = pd.merge(df_owid, df_merged, how="outer", on=["Entity", "Code"])
    df.to_csv("owid.csv")
    # after this, I have opened the file in excel and clean the data manually
    return df


def inspect_with_wb():

    df_wb = wb.get_countries()
    df_wb["WB"] = df_wb.index

    df_owid = pd.read_csv("custom/owid.csv")
    df_owid["OWID"] = df_owid["Code"]

    df = pd.merge(df_owid, df_wb, how="outer",
                  left_on="Code", right_index=True)
    df.to_csv("owidwb.csv")
    # after this, I have opened the file in excel and clean the data manually
    return df


def insepct_with_weo():
    # read weo dataset
    path, url = weo.download(2022, 1)
    print(path, url)
    # weo_2022_1.csv 18.8Mb
    # Downloaded 2022-Apr WEO dataset
    df_weo: pd.DataFrame = weo.WEO(path).countries()
    df_weo = df_weo[["ISO", "Country"]]

    df_weo["WEO"] = df_weo["ISO"]

    df_owid_wb = pd.read_csv("custom/owid_wb.csv")

    df = pd.merge(df_owid_wb, df_weo, left_on="Code",
                  right_on="ISO", how="outer")

    df.to_csv("owid_wb_weo.csv")
    # after this, I have opened the file in excel and clean the data manually
    return df


def publish_entities_dataset(name_already_set = False):

    df = pd.read_excel("custom/ProcessBook.xlsx", sheet_name="entities")

    df.to_csv("entities.csv", index=False)
    
    return df


def main():
    merge_all_owid_data()
    inspect_with_wb()
    insepct_with_weo()
    # Then finally, I renamed the columns and published the Entities csv dataset
    publish_entities_dataset()


publish_entities_dataset()
