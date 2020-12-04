type JSON = any;
export type SimpleValue = string | boolean | number;

export interface ASTNode {
    name: string,
    start: number,
    end: number,
    children?: ASTNode[],
    skip?: boolean,
    error?: string,
    value?: any;
}

export type ParseMode = "PARSE"|"EVAL";

export interface Context {
    grammarTag: string;
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
    children: string;
    value: string;
}

export interface ASTNodeVisitor {
    enter(n: ASTNode): false | void;
    leave?(n: ASTNode): void;
}

export interface ASTIterator {
    traverse(visitor: ASTNodeVisitor);
}

export class ASTNodeImpl implements ASTNode {
    constructor(
        public name: string,
        public start: number,
        public end: number,
        public children?: ASTNode[],
        public skip?: boolean,
        public error?: string
    ) {

    }
}

export interface JSONWithMapping {
    json: JSON;
    mapping: JSONMapping;
}

export const OPTION_JSON_MAPPING = 'jsonMapping';
export const OPTION_ROOT_TAGS = 'rootTags';

export type ParseResult = SimpleValue | JSON | JSONWithMapping | ASTIterator;

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
