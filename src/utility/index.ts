import path from "path"

export default class Utility {
    static omitFromArray<T>(list: T[], element: T): T[] {
        return list.filter(value => value != element)
    }

    // npm:walk-up-path
    static *walkUpPath(directory: string) {
        for (directory = path.resolve(directory); path; ) {
            yield directory
            const parent = path.dirname(directory)
            if (parent === directory) directory = null
            else directory = parent
        }
    }
}
