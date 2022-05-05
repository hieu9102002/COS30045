# Data processing process
## Collect data
Collect data from different sources: 
consumption: btu
production
codes and documentation

### Source: State Energy Data System (SEDS): 1960-2019 (complete)

https://www.eia.gov/state/seds/seds-data-complete.php#CompleteDataFile

https://www.eia.gov/state/seds/seds-data-complete.php

https://www.eia.gov/state/seds/seds-data-complete.php?sid=US

All consumption estimates in Btu: 
- https://www.eia.gov/state/seds/sep_use/total/csv/use_all_btu.csv

All production estimates:
- https://www.eia.gov/state/seds/sep_prod/xls/Prod_dataset.xlsx

Technotes:
- https://www.eia.gov/state/seds/sep_use/notes/use_technotes.pdf

Complete dataset: (download the .zip file is faster)
- https://www.eia.gov/state/seds/CDF/Complete_SEDS.csv
- https://www.eia.gov/state/seds/CDF/Complete_SEDS.zip

Code and descriptions:
- https://www.eia.gov/state/seds/CDF/Codes_and_Descriptions.xlsx
- https://www.eia.gov/state/seds/CDF/Codes_and_Descriptions.csv


Data changes:
- https://www.eia.gov/state/seds/seds-data-changes.php
- https://www.eia.gov/state/seds/seds-data-changes.php?sid=US

Flowchart:
- https://www.eia.gov/totalenergy/data/flow-graphs/total-energy.php
- https://www.eia.gov/totalenergy/data/flow-graphs/export-data/total-energy.xls

## Data selection

Below is the MSN and their names to be used for the energy consumption breakdown:

| MSN   | Name              |
|-------|-------------------|
| WDTCB | Wood              |
| WSTCB | Waste             |
| WWTCB | WoodAndWaste      |
| BFTCB | Biofuels          |
| BMTCB | Biomass           |
| SOTCB | Solar             |
| WYTCB | Wind              |
| GETCB | Geothermal        |
| HYTCB | Hydropower        |
| RETCB | TotalRenewable    |
| PMTCB | Petroleum         |
| NNTCB | NaturalGas        |
| CLTCB | Coal              |
| CCNIB | CoalCokeNetImport |
| FFTCB | TotalFossilFuel   |
| NUETB | Nuclear           |
| ELEXB | ElectricityExport |
| ELIMB | ElectricityImport |
| TETCB | TotalConsumption  |

### Documentation and methodology notes to determine the MSN
https://www.eia.gov/totalenergy/data/monthly/pdf/flow/renewable-spaghettichart-2021.pdf
https://www.eia.gov/totalenergy/data/monthly/
https://www.eia.gov/totalenergy/data/flow-graphs/electricity.php
https://www.eia.gov/totalenergy/data/flow-graphs/total-energy.php
https://www.eia.gov/totalenergy/data/monthly/pdf/mer.pdf
https://flowcharts.llnl.gov/commodities/energy
https://www.eia.gov/energyexplained/us-energy-facts/
https://www.eia.gov/energyexplained/use-of-energy/

### Chart Examples

https://www.iea.org/sankey/#?c=United%20States&s=Final%20consumption
https://ourworldindata.org/energy-mix



### A breakdown of MSN:

- TETCB = ELEXB - ELIMB + NUETB + FFTCB + RETCB
    - FFTCB = PMTCB + NNTCB + CLTCB + CCNIB
    - RETCB = HYTCB + GETCB + WYTCB + SOTCB + BMTCB
        - BMTCB = BFTCB + WWTCB
            -  WWTCB = WSTCB + WDTCB

- SOTCB = SOEGB + SOTXB
    - SOTXB = SOCCB + SOICB + SORCB

- PATCB = PMTCB + (BFTCB - BFLCB)

- Biofuel: BF = BD (Biodiesel) + EM (Fuel Ethanol)
    - However, EIA Monthly Energy Data also includes Renewable Diesel and other biofuel. However, the addition is still correct. Apparently SED data does not include Renewable Diesel and other biofuel. See: https://www.eia.gov/totalenergy/data/browser/?tbl=T10.02B#/?f=A&start=1949&end=2021&charted=11-17-16-15

Total End use consumption:
- TC = EG(or)EI + TX
- TX = CC + IC + RC + AC

Non combustible renewable: geothermal + solar + wind + hydropower

## Sankey Chart nodes
- Production source
- Consumption source
- 5 use sectors
    - Electric power sector (maybe include Elctricity net generation? - Add new node: consumption source -> Tansformed into electricity -> electric power sector)