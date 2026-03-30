In this folder are views to test the custom card.

You need to create the following entities:
- `input_number.inputnumbertestmin`
- `input_number.inputnumbertestmax`
- `input_datetime.inputheuretestmin`
- `input_datetime.inputheuretestmax`

Create the views copy/pasting the yaml in the yaml editor

Warning: two entities from `number` domain are used: `number.bureaucontrole_chauffagetempcftmin` and `number.bureaucontrole_chauffagetempcftmax`. They are used to test the `number` domain is working well but should be replaced by existing entities from `number` domain in the test environment.