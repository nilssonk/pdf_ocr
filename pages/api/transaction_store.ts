export type ExecOutput = {
    stdout: string;
    stderr: string;
};

export var transactions: {
    [key: string]: {
        tmpfile: string;
        promise: Promise<ExecOutput>;
    };
} = {};
