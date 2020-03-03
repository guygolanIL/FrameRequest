const FrameChannel = (
    channelName = "defaultName",
    handlers,
    iframeSelector,
    options = {
        timeout: 2000
    }
) => {
    const waitingPromises = {};

    window.addEventListener("message", ({ data }) => {
        const { senderChannel, requestName, payload, type } = data;
        if (senderChannel === channelName) {
            handleMessage(requestName, payload, type);
        }
    });

    function createReply(requestName) {
        return payload => {
            return postToFrame(requestName, payload, "response");
        };
    }

    function handleMessage(requestName, payload, type) {
        let target;
        if (type === "request") {
            target = handlers;
            payload = {
                payload,
                reply: createReply(requestName)
            };
        } else if (type === "response") {
            target = waitingPromises;
        }
        target[requestName](payload);
    }

    function postToFrame(requestName, payload, type) {
        let target;

        if (iframeSelector) {
            // in parent
            const iframe = document.querySelector(iframeSelector);
            target = iframe.contentWindow;
        } else {
            // in iframe
            target = window.parent;
        }

        target.postMessage({
            senderChannel: channelName,
            requestName,
            payload,
            type
        });
    }

    function post(requestName, payload, type) {
        return new Promise((resolve, reject) => {
            postToFrame(requestName, payload, type);

            setTimeout(
                () => reject(`timed out after ${options.timeout}ms`),
                options.timeout
            );

            let target;
            if (type === "request") {
                target = waitingPromises;
            } else if (type === "response") {
                target = handlers;
            }
            target[requestName] = resolve;
        });
    }

    function request(requestName, payload) {
        return post(requestName, payload, "request");
    }

    return {
        handlers,
        request
    };
};
