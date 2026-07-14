---
description: Generate data scrapper script based on the user input regardless of programming language.
---

## Step by Step Procedure

Follow these steps when generating the script

### Step 1:

Write the python script base on user request. Generate the file in `.asd/artifacts`.

### Step 2:

Write `README.md` on how to use the script. Keep this file at the root of the project and make it reference `.asd/artifacts` as the generated artifact location.

## Rules

- If the machine does not have python installed, suggest to use to install it first.
- Provide guidance on how to install python on the current setup.
- Add message at the end of response saying `Deferred: Need to install python first`
- If any issue encountered during script generation, deferred the process and out the following:
  `Deferred: <state the issue>`
