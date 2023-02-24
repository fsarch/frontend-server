export type MetaData = {
    currentVersion: string | null;
    versions: {
        [version: string]: {
            files: {
                [fileName: string]: {
                    hash: string;
                };
            };
        };
    };
    versionsArray: string[];
    files: {
        [fileName: string]: string[];
    };
};
