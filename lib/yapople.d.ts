import { TlsOptions } from "tls";

interface YapopleClientConfig {
    host: string;
    port:  number;
    tls?: boolean;
    mailparser?: boolean;
    username: string;
    password: string;
    options?: TlsOptions;
}

interface Message {
    html: string;
    text: string;
    headers: Record<string,string>;
    subject: string;
    references: string[];
    messageId: string;
    inReplyTo: string[];
    priority: string;
    from: { address: string, name: string }[];
    replyTo: { address: string, name: string }[];
    to: { address: string, name: string }[];
    date: Date;
    receivedDate: Date;
    attachments?:MessageAttachment[]
}   

interface MessageAttachment{
    contentType: string,
    fileName: string,
    transferEncoding: string,
    contentDisposition: string,
    contentId: string,
    generatedFileName: string,
    checksum: string,
    length: number,
    content: Buffer;
}

export class Client {
    constructor(config: YapopleClientConfig)
    connect(config?:YapopleClientConfig): Promise<void>;
    count(): Promise<number>;
    retrieve(messageNumber:number[]):Promise<Message[]>
    retrieve(messageNumber:number):Promise<Message>
    retrieve(messageNumber:number|number[]):Promise<Message[]>|Promise<Message>
    retrieveAll(): Promise<Message[]>;
    delete(messageNumber:number[]):Promise<Message[]>
    delete(messageNumber:number):Promise<Message>
    delete(messageNumber:number|number[]):Promise<Message[]>|Promise<Message>
    deleteAll(): Promise<any>;
    retrieveAndDeleteAll(): Promise<Message[]>;
    list(messageNumber:number):Promise<any>;
    quit():Promise<void>;
    rset():Promise<void>;
    disconnect():Promise<void>
}
