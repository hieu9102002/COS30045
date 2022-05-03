# Unpivot the original dataset to a long-format dataset for further processing

import pandas as pd

FILE_ORIGINAL_DATASET = "use_all_btu.csv"

NON_YEAR_COLUMNS = ["Data_Status", "State", "MSN"]

FILE_NEW_DATASET = "database.csv"

DF_DATA_ORIGINAL = pd.read_csv(FILE_ORIGINAL_DATASET)

# Unpivot the dataframe
DF_DATA = pd.melt(
    df=DF_DATA_ORIGINAL, 
    id_vars=NON_YEAR_COLUMNS,
    var_name="Year", 
    value_name="Value"
)

DF_DATA.to_csv(FILE_NEW_DATASET)

