export default class Utility {
    static omitFromArray<T>(list: T[], element: T): T[] {
        return list.filter(value => value != element)
    }
}
