
interface FetchNode {
  name: string;
  key: string;
  params: { [key: string]: FetchNode };
}

interface FetchInstruction {
  node: FetchNode;
  paramLength: number;
  parentKey: string;
}

interface FetchEvaluationValue {
  key: string;
  value: any;
}

interface FetchEvaluationCallback {
  (name: string, key?: string, params?: { [key: string]: any }): Promise<any>;
}

export default class FetchExpression {
  defaultKeyName = 'id';

  parse(expression: string) {
    const fetchRegex = /(\w+)\s*(?:\(\s*(.+)\s*\))?\s*(?:\.\s*(\w*))?/;
    const result = fetchRegex.exec(expression);

    if (!result) {
      throw new Error('FetchExpression.parse: A parsing error occured on: ' + expression);
    }

    const node: FetchNode = {
      name: result[1],
      key: result[3] ? result[3] : (result[2] ? this.defaultKeyName : null),
      params: null
    };

    if (result[2]) {
      const paramRegex = /^(\w*)\s*=\s*(.*)$/;
      const paramResult = paramRegex.exec(result[2]);

      if (paramResult) {
        node.params = {
          [paramResult[1]]: this.parse(paramResult[2])
        };
      } else {
        node.params = {
          [this.defaultKeyName]: this.parse(result[2])
        };
      }
    }

    return node;
  }

  getInstructionStack(root: FetchNode) {
    const pendings: FetchInstruction[] = [{
      node: root,
      paramLength: root.params ? Object.keys(root.params).length : 0,
      parentKey: null
    }];
    const stack: FetchInstruction[] = [];

    while (pendings.length > 0) {
      const item = pendings.pop();

      stack.push(item);

      if (item.node.params) {
        for (const key in item.node.params) {
          const child = item.node.params[key];

          pendings.push({
            node: child,
            paramLength: child.params ? Object.keys(child.params).length : 0, 
            parentKey: key
          });
        }
      }
    }

    return stack;
  }

  async evaluate(instructions: FetchInstruction[], cb: FetchEvaluationCallback) {
    const evalStack: FetchEvaluationValue[] = [];

    for (let i = instructions.length - 1; i >= 0; --i) {
      const item = instructions[i];
      const params = {};

      for (let i = 0; i < item.paramLength; i++) {
        const v = evalStack.pop();
        params[v.key] = v.value;
      }

      const value = await cb(item.node.name, item.node.key, item.paramLength > 0 ? params : null);

      evalStack.push({
        key: item.parentKey,
        value: value
      });
    }

    return evalStack[0].value;
  }
}
