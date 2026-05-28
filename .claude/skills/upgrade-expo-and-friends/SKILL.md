---
description: Upgrades Expo and other dependencies in the project to their latest versions, ensuring compatibility and taking advantage of new features and bug fixes.
disable-model-invocation: true
allowed-tools: WebSearch, WebFetch, Bash(npm run android), Bash(npm run type-check), Bash(npm run lint), Bash(npm run test), Bash(npx expo-doctor)
context: fork
---

- Run the expo /upgrading-expo skill if available.
- Build the app to see if there are any errors. If there are, fix them and make sure the app builds successfully.
  - If there are any other packages that have to be updated to satisfy cross-dependency requirements, report about them, listing the reason for the update.
- Spawn another agent to search in parallel blogposts or other information online about the versions that are going to be reached. Create an md file with the below information:
  - Report about any breaking changes that are being introduced in the new versions of the dependencies.
    - Analyze the code and make sure that the new versions are being used in a way that is compatible with the old versions; if not, suggest code changes to make the code compatible with the new versions.
  - Report about the new possibilities that come with these versions:
    - first in the list should be the novelties in the new Expo version
    - then the novelties in React Native,
    - finally the novelties in React
    - if there are any other dependencies that are being updated, also report about their novelties