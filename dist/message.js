"use strict";
(function (global, factory) {
    if (typeof define === 'function' && define.amd)
        define(["protobufjs/light"], factory);
    else if (typeof require === 'function' && typeof module === 'object' && module && module.exports)
        module.exports = factory(require("protobufjs/light"));
})(this, function ($protobuf) {
    "use strict";
    const $root = ($protobuf.roots["default"] || ($protobuf.roots["default"] = new $protobuf.Root()))
        .addJSON({
        main: {
            options: {
                go_package: "./main"
            },
            nested: {
                Cookie: {
                    fields: {
                        name: {
                            type: "string",
                            id: 1
                        },
                        value: {
                            type: "string",
                            id: 2
                        },
                        path: {
                            type: "string",
                            id: 3
                        },
                        domain: {
                            type: "string",
                            id: 4
                        },
                        maxAge: {
                            type: "int32",
                            id: 5
                        },
                        raw: {
                            type: "string",
                            id: 6
                        }
                    }
                },
                File: {
                    fields: {
                        key: {
                            type: "string",
                            id: 1
                        },
                        name: {
                            type: "string",
                            id: 2
                        },
                        data: {
                            type: "bytes",
                            id: 3
                        }
                    }
                },
                HeaderValue: {
                    fields: {
                        value: {
                            rule: "repeated",
                            type: "string",
                            id: 1
                        }
                    }
                },
                RawBody: {
                    oneofs: {
                        rawData: {
                            oneof: [
                                "asPlain",
                                "asBinary"
                            ]
                        }
                    },
                    fields: {
                        enabled: {
                            type: "bool",
                            id: 1
                        },
                        type: {
                            type: "RawBodyType",
                            id: 2
                        },
                        asPlain: {
                            type: "string",
                            id: 3
                        },
                        asBinary: {
                            type: "bytes",
                            id: 4
                        }
                    },
                    nested: {
                        RawBodyType: {
                            values: {
                                Plain: 0,
                                Binary: 1
                            }
                        }
                    }
                },
                RequestMessage: {
                    fields: {
                        url: {
                            type: "string",
                            id: 1
                        },
                        method: {
                            type: "string",
                            id: 2
                        },
                        headers: {
                            keyType: "string",
                            type: "string",
                            id: 3
                        },
                        params: {
                            keyType: "string",
                            type: "string",
                            id: 4
                        },
                        rawBody: {
                            type: "RawBody",
                            id: 5
                        },
                        files: {
                            rule: "repeated",
                            type: "File",
                            id: 6
                        }
                    }
                },
                ResponseMessage: {
                    fields: {
                        code: {
                            type: "uint32",
                            id: 1
                        },
                        headers: {
                            keyType: "string",
                            type: "HeaderValue",
                            id: 2
                        },
                        cookies: {
                            rule: "repeated",
                            type: "Cookie",
                            id: 3
                        },
                        body: {
                            type: "bytes",
                            id: 4
                        }
                    }
                }
            }
        }
    });
    return $root;
});
