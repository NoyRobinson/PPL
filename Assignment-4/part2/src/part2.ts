// PPL 2023 HW4 Part2

// Q 2.1 

// Specify the return type.
export const delayedSum = (a: number, b: number, delay: number) : Promise<number> => {
    return new Promise((resolve) => {
        setTimeout(() => resolve(a+b), delay)
    });
}

export const testDelayedSum = () : Promise<boolean|void> => {
    const beforeDelay = Date.now();
    return delayedSum(2, 3, 1000)
        .then(() => {
            const afterDelay = Date.now();
            const delayedTime = afterDelay - beforeDelay;
            if(delayedTime >= 1000)
                return true;
            else
                return false;
        })
        .catch(error => console.error(error));
    }


// Q 2.2

// Values returned by API calls.
export type Post = {
    userId: number;
    id: number;
    title: string;
    body: string;
}

// When invoking fetchData(postsUrl) you obtain an Array Post[]
// To obtain an array of posts
export const postsUrl = 'https://jsonplaceholder.typicode.com/posts'; 

// Append the desired post id.
export const postUrl = 'https://jsonplaceholder.typicode.com/posts/'; 

// When invoking fetchData(invalidUrl) you obtain an error
export const invalidUrl = 'https://jsonplaceholder.typicode.com/invalid';

// Depending on the url - fetchData can return either an array of Post[] or a single Post.
// Specify the return type without using any.
export const fetchData = async (url: string) : Promise<Post|Post[]> => {
    try{
        const response = await fetch(url); //make an HTTP request to an API endpoint
        if(response.ok){
            const data = await response.json();
            if(Array.isArray(data))
                return data;
            else
                return [data];
        }
        else
            throw new Error("Http error");
    } catch (err){
        throw new Error("Http error");
    }
};

export const testFetchData = async(url: string): Promise<string> => {
      try {
        const result = await fetchData(url);
            return "success"; // Successful response, handle the data as needed
      } catch (error) {
            return "failure"; // Error occurred, handle the error
      }
}

// Q 2.3

// Specify the return type.
// export const fetchMultipleUrls = async (urls: string[]) : Promise<(Post|Post[])[]> => {
//     return await Promise.all(urls.map(url => fetchData(url)));
// }

export const fetchMultipleUrls = async (urls: string[]) : Promise<(Post|Post[])[]> => {
        return await Promise.all(urls.map(url => fetchData(url)));
    }

export const testFetchMultipleUrls = async(url: string) : Promise<string>=> {
    const urls20 = [];
    for(let i = 1; i <= 20; i++){
        urls20.push(url + "/" + i);
    }

    try {
        const result = await fetchMultipleUrls(urls20);
            return "success"; // Successful response, handle the data as needed
    } catch (error) {
           return "failure"; // Error occurred, handle the error
    }
}
