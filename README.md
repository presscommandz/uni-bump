# uni-bump

Universal bump semantic version

## Install (local)

```bash
yarn global add file://<path to uni-bump directory>
```

## Usage

Project platform can be specified by 2 ways:

-   Pass `--platform <platform>` in CLI
-   Create file `bumpversion.json` in current working directory:

```json
{
  "platform": "node"
}
```
