export default class StreamCombiner {
    chunkData: string[] | null = null;

    addChunk(data: string): string[] {
        const dataParts = data.split('\n');

        const retVal: string[] = [];

        let tempDataPart: string | null = null;
        for (let i = 0, z = dataParts.length; i < z; i += 1) {
            if (tempDataPart !== null) {
                if (this.chunkData) {
                    this.chunkData.push(dataParts[0]);
                    retVal.push(this.chunkData.join(''));
                    this.chunkData = null;
                } else {
                    retVal.push(tempDataPart);
                }
            }

            tempDataPart = dataParts[i];
        }

        if (this.chunkData && tempDataPart !== null) {
            this.chunkData.push(tempDataPart);
        } else if (tempDataPart !== null) {
            this.chunkData = [tempDataPart];
        }

        return retVal;
    }
}
