import {OpenAIApi, Configuration} from 'openai-edge';

const config = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
});

export const openai = new OpenAIApi(config);

export async function getEmbeddings(text: string){
    try{
        const response =  await openai.createEmbedding({
            model: 'text-embedding-ada-002',
            input: text.replace(/\n/g, ' ')
        });
        const result = await response.json();
        if(result.data) {
            //console.log('results of embeddings: ',result);
            return result.data[0].embedding as number[];
        } else {
            //console.log('Error: result.data is undefined');
        }  
    } catch (error){
        console.log('error creating openai embeddings api', error);
        throw error;
    }
}