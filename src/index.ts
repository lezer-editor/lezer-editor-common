import {transform } from 'node-json-transform';
import { Stack } from 'stack-typescript';

/*
    Example:

    JSONMapping: 1+2

        getOption('jsonMapping') : JSONMapping = {
            "name": "name",
            "start": "idStart", "end": "idEnd",
            "children": "c"
        }
        
        parse('1+2', {mode: 'PARSE'}) : JSON = {
            name: '+',
            idStart: 1, idEnd: 2,
            c: [
                {name: '1', idStart: 0, idEnd: 1}, {name: '2', idStart: 2, idEnd: 3}
            ]
        }
    */

export interface ParserAdapter {
    getOption(key: string): any;
    parse(input: string, context: Context): ParseResult;
}

export type SimpleValue = string | boolean | number;
export type ParseResult = SimpleValue | JSON | JSONWithMapping | ASTIterator<ASTNode>;
type JSON = any;

export interface ASTNodeProps {
    name: string,
    start: number,
    end: number,
    skip?: boolean,
    error?: string,
    value?: any;
}
export interface ASTNode extends ASTNodeProps {
    
}

export interface HydratedASTNodeProps extends ASTNodeProps {
    children: HydratedASTNode[];
}

export interface HydratedASTNode extends ASTNode, HydratedASTNodeProps {
    dehydrate(): ASTNode;
}

// merge the interface with the class (class will gain iface props automagically)
export interface ASTNodeImpl extends ASTNode {}

export class ASTNodeImpl implements ASTNode {
    constructor(
        props: ASTNodeProps
    ) {
        Object.assign(this, props);
    }
}

/* An ASTNode hydrated with it's children */
export class HydratedASTNodeImpl extends ASTNodeImpl implements HydratedASTNode {
    children: HydratedASTNode[] = [];

    constructor(
        props: HydratedASTNodeProps
    ) {
        super(props);
    }

    dehydrate(): ASTNode {
        return new ASTNodeImpl({...this, children: undefined});
    }

    static from(n : ASTNode) {
        return new HydratedASTNodeImpl({...n, children: []});
    }
}

export type ParseMode = "PARSE" | "EVAL";

export interface Context {
    grammarTag: string;
    astIterator?: ASTIterator<ASTNode>;
    mode?: ParseMode;
    dataContext?: any;
    [otherProps: string]: any;
}

export interface JSONMapping {
    name: string;
    start: string;
    end: string;
    skip: string;
    error: string;
    value: string;
    children: string;
}

export interface ASTNodeVisitor<T extends ASTNode> {
    enter(n: T): false | void;
    leave?(n: T): void;
}

export interface ASTIterator<T extends ASTNode> {
    traverse(visitor: ASTNodeVisitor<T>): void;
    hydrate(): ASTIterator<HydratedASTNode>;
}

export abstract class ASTIteratorImpl<T extends ASTNode> implements ASTIterator<T> {
    abstract traverse(visitor: ASTNodeVisitor<T>): void;

    hydrate(): ASTIterator<HydratedASTNode> {
        const self = this;
        const stack = new Stack<HydratedASTNode>();
        const r = new class extends ASTIteratorImpl<HydratedASTNode> {
            traverse(visitor: ASTNodeVisitor<HydratedASTNode>): void {

                self.traverse({
                    enter(n : T) {
                        const rn = HydratedASTNodeImpl.from(n);
                        stack.push(rn);
                        visitor.enter(rn);
                    },
        
                    leave(n: T) {
                        const current = stack.pop();
                        const parent = stack.top;
                        if (parent) {
                            parent.children = parent.children || [];
                            parent.children.push(current);
                        }
                        visitor.leave(current);
                    }
                });

            }
        };
        return r;
    }
}

export interface JSONWithMapping {
    json: JSON;
    mapping: JSONMapping;
}

export const OPTION_JSON_MAPPING = 'jsonMapping';
export const OPTION_ROOT_TAGS = 'rootTags';

export const ASTIterators = {
    fromIdentity<T extends ASTNode>(n: T): ASTIterator<T> {
        return new class extends ASTIteratorImpl<T> {
            traverse(v: ASTNodeVisitor<T>) {
                v.enter(n);
                v.leave(n);
            }
        }
    },

    fromHydratedJson<T extends ASTNode>(json: JSON, jsonMapping: JSONMapping, dehydrate: boolean): ASTIterator<T> {
        const txMapping = {
            item: jsonMapping, operate: [{
                on: jsonMapping['children'],
                run: (json) => transform(json, txMapping)
            }]
        };
        const ast: HydratedASTNode = transform(json, txMapping);

        return toASTIterator(ast, dehydrate);
    },

    toList<T extends ASTNode>(it: ASTIterator<T>): T[] {
        const r = [];
        it.traverse({
            enter(n: T) {
                r.push(n);
            }
        })
        return r;
    }

}

export type HydratedOrASTNode = ASTNode | HydratedASTNode;

function toASTIterator(node: HydratedASTNode, dehydrate: boolean): ASTIterator<HydratedOrASTNode> {
    
    const recurse = (node: HydratedASTNode, visitor: ASTNodeVisitor<HydratedOrASTNode>) => {
        const n = dehydrate ? node.dehydrate() : node;
        visitor.enter(n);

        node.children?.forEach(c => {
            recurse(c, visitor);
        });

        visitor.leave(n);
    }

    return new class extends ASTIteratorImpl<HydratedOrASTNode> {
        traverse(visitor: ASTNodeVisitor<HydratedOrASTNode>) {
            recurse(node, visitor);
        }
    }
}