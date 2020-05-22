export interface IOptions {
    timeout: number;
}

export enum MessageType {
    REQUEST,
    RESPONSE
}

export class FrameChannel {
    private static DEFAULT_TIMEOUT: number = 2000;

    private readonly channelName: string;
    private readonly handlers: any;
    private readonly iframeSelector?: string;  // if iframe selector not provided assuming its the inner iframe
    private options: IOptions;
    private waitingPromises: any = {};

    constructor(
        channelName: string,
        handlers: any,
        iframeSelector?: string,
        options: IOptions = {timeout: FrameChannel.DEFAULT_TIMEOUT}
    ) {
        if (!channelName) throw new Error("A channel name is mandatory");

        this.channelName = channelName;
        this.handlers = handlers;
        this.iframeSelector = iframeSelector;
        this.options = options;

        window.addEventListener("message", ({data}) => {
            const {senderChannel, requestName, payload, type} = data;
            if (senderChannel === channelName) {
                this.handleMessage(requestName, payload, type);
            }
        });
    }

    private handleMessage(
        requestName: string,
        payload: any,
        type: MessageType
    ) {
        let target: any;
        if (type === MessageType.REQUEST) {
            target = this.handlers;
            payload = {
                payload,
                reply: this.createReply(requestName)
            };
        } else if (type === MessageType.RESPONSE) {
            target = this.waitingPromises;
        }
        target[requestName](payload);
    }

    private createReply(requestName: string): (payload: any) => void {
        return (payload: any) => {
            return this.postToFrame(requestName, payload, MessageType.RESPONSE);
        };
    }

    private postToFrame(requestName: string, payload: any, type: MessageType): void {
        let target;
        let targetDomain: string = "*";
        if (this.iframeSelector) {
            // in parent
            const iframe: HTMLIFrameElement | null = document.querySelector(
                this.iframeSelector
            );
            if (iframe) {
                target = iframe.contentWindow;
                targetDomain = iframe.src;
            }
        } else {
            // in iframe
            target = window.parent;
        }

        if (target) {
            target.postMessage(
                {
                    senderChannel: this.channelName,
                    requestName,
                    payload,
                    type
                },
                targetDomain,
                undefined
            );
        } else {
            throw new Error("Tried to post to a non-existing target");
        }
    }

    private post(requestName: string, payload: any, type: MessageType) {
        return new Promise((resolve, reject) => {
            this.postToFrame(requestName, payload, type);

            setTimeout(
                () => reject(`timed out after ${this.options.timeout}ms`),
                this.options.timeout
            );

            let target;
            if (type === MessageType.REQUEST) {
                target = this.waitingPromises;
            } else if (type === MessageType.RESPONSE) {
                target = this.handlers;
            }
            target[requestName] = resolve;
        });
    }

    public request(requestName: string, payload: any) {
        return this.post(requestName, payload, MessageType.REQUEST);
    }
}
