export interface Node {
    node: {
        id: string;
        name: string;
    };
}

export function mapToNode(input: any): Node[] {
    const result = input.map((obj: any) => {
        if (!obj || !obj.node) return null

        var res: Node = {
            node: {
                id: obj.node.id || obj.node.user.id,
                name: (obj.node.name || obj.node.user.firstName + ' ' + obj.node.user.lastName),
            }
        }

        return res
    }).filter((obj: any): obj is Node => obj !== null)

    return result
}

export function nodeMapper(value: string[], nodeInput: Node[]) {
    return value.map(val => {
        const node = nodeInput?.find(node => node.node.id === val)
        return node ? node.node.name : 'unknown'
    }).join(', ')
}
