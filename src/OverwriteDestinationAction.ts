import { ArgumentParser, Namespace, Action } from "argparse"

class OverwriteDestinationAction extends Action {
    call(
        _parser: ArgumentParser,
        namespace: Namespace,
        values: any,
        optionString: string | null
    ): void {
        // @ts-ignore
        const value = values ?? this.default ?? true
        namespace[this.dest] = {
            switchOpt: optionString,
            value
        }
    }
}

export default OverwriteDestinationAction
