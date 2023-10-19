import axios from "axios";

const instance = axios.create({
  baseURL: 'http://rims.croot.com/api/rms/'
});

instance.interceptors.request.use(
  function (config) {
    return config;
  }
)

export default instance;