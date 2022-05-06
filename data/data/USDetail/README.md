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

CO2:
- https://www.eia.gov/environment/emissions/state/pdf/intro_key_concepts.pdf
- https://www.eia.gov/environment/emissions/state/
- https://www.eia.gov/environment/emissions/state/analysis/pdf/stateanalysis.pdf
- https://www.digmap.com/blog/united-states-carbon-dioxide-emission-levels-state/
- https://www.epa.gov/ghgemissions/inventory-us-greenhouse-gas-emissions-and-sinks


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

A breakdown of MSN:

- TETCB = ELEXB - ELIMB + NUETB + FFTCB + RETCB
    - FFTCB = PMTCB + NNTCB + CLTCB + CCNIB
    - RETCB = HYTCB + GETCB + WYTCB + SOTCB + BMTCB
        - BMTCB = BFTCB + WWTCB
            -  WWTCB = WSTCB + WDTCB

## Nodes
### Production
- Solar
- Wind
- Geothermal
- Hydropower
- Biomass-Biodiesel
- Biomass-Fuel ethanol
- Biomass-Wood
- Waste
- Coal
- Coal coke import
- Coal coke export
- Natural gas
- Petroleum
- Nuclear energy
- Electricity Import
### Consumption (Supply)
- Solar
- Wind
- Geothermal
- Hydropower
- Biodiesel
- Fuel ethanol
    - losses and coproducts
- Wood
- Waste
- Coal
- Natural gas
- Petroleum
- Nuclear energy
### Electric Power
- Electric Power
### Electricity sales
- Transportation
- Industrial
- Residential
- Commercial
-  Electricity Export
### Electricity loss
- Transportation
- Industrial
- Residential
- Commercial
### End-use
- Transportation
- Industrial
- Residential
- Commercial
