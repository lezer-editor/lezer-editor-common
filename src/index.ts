import { NodeType, Parser } from 'lezer';

export interface IInterpreter {
    evaluate(node: NodeType, input: string, args: any[]): any;
}

export interface IEditorInfo {
    getGrammarTags() : string[];
    getInterpreter(grammarTag): IInterpreter | null;
    getTokenType(node : NodeType): string;

}

export interface IGrammar {
    getEditorInfo(): IEditorInfo;
    LezerParser : Parser;
}