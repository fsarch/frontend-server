export type MetaData = {
    currentVersion: string | null;
    versions: {
        [version: string]: {
            files: {
                [fileName: string]: {
                    hash: string;
                    size: number;
                    path: string;
                    mime: string;
                };
            };
        };
    };
    versionsArray: string[];
    files: {
        [fileName: string]: string[];
    };
};
