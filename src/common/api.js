import axios from "axios";
import querystring from "querystring";
import shared from "@/common/shared";

const server = 'https://b2b-api.tutoring.co.kr';

const api = {
    get : async function(endpoint, params) {
        const headers = {
            'BAST': shared.getToken()
        };
        const res = await axios.get(`${server}${endpoint}`, {headers,params});
        return res.data;
    },

    post: async function (endpoint, params) {
        const headers = {
            'Content-Type':'application/x-www-form-urlencoded',
            'BAST': shared.getToken()
        };
        const res = await axios.post(`${server}${endpoint}`, querystring.stringify(params), {headers});
        return res.data;
    }
}

export default api;