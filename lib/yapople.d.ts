interface YapopleClientConfig {
    host: string;
    port:  number;
    tls?: boolean;
    mailparser?: boolean;
    username: string;
    password: string;
    options?: any;
}

interface Message {
    html: string;
    headers: any;
    subject: string;
    references: string[];
    messageId: string;
    inReplyTo: string[];
    priority: string;
    from: object[];
    replyTo: object[];
    to: object[];
    date: Date;
    receivedDate: Date;
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
    disconnect():Promise<void>
}
