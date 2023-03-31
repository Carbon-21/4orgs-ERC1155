// Middleware: inject recaptcha

const axios = require("axios").default;
const _ = require("lodash");
const logger = require("../util/logger");
const HttpError = require("../util/http-error");
const SCORE_MIN = 0.5;
const RECAPTCHA_URL = "https://www.google.com/recaptcha/";
const RECAPTCHA_API_PATH = "api.js";
const RECAPTCHA_VERIFY_PATH = "api/siteverify";

class RecaptchaMiddleware {
    static getScript(res) {
        if (process.env.RECAPTCHA_KEY == void 0) {
            logger.warn('Missing recaptcha key')
            return
        }
        if (res.recaptcha) {
            logger.debug('Recaptcha script already loaded')
            return
        }
        logger.debug('Creating recaptcha script')
        res.recaptcha = `<script src="${RECAPTCHA_URL}${RECAPTCHA_API_PATH}?render=${process.env.RECAPTCHA_KEY}"> </script>` +
            `<script> let recaptchaKey = '${process.env.RECAPTCHA_KEY}'</script>`
    }

    static #validate(req, recaptchaToken) {
        logger.debug('Validating Recaptcha ')
        if (recaptchaToken == void 0) {
            logger.warn('Missing Recaptcha Token')
            throw new HttpError(422, 'Falha nas validaçoes de segurança.')
        }
        let recaptchaSecret = process.env.RECAPTCHA_SECRET
        let remoteIP = req.headers && req.headers['x-forwarded-for'] ? req.headers['x-forwarded-for'] : req.connection.remoteAddress;
        const options = {
            params: {
                'secret': recaptchaSecret,
                'response': recaptchaToken,
                'remoteip': remoteIP
            }
        };
        return axios.post(`${RECAPTCHA_URL}${RECAPTCHA_VERIFY_PATH}`, null, options)
    }
    
    static async verify(req, res) {
        let recaptchaToken = null;
        if (req.body && req.body['recaptcha']) recaptchaToken = req.body['recaptcha'];
        if (recaptchaToken == void 0) {
            logger.warn('Recaptcha not provided')
            return
        }
        let response = await this.#validate(req, recaptchaToken)
        if (_.get(response, 'data.success', false) == false) {
            logger.warn('Recaptcha err: ', _.get(response, 'data', ''))
            res.json({ success: false, err: 'Recaptcha invalido.' });
        } else {
            logger.debug('Recaptcha score: ', _.get(response, 'data.score', 0));
            if (_.get(response, 'data.score', 0) < SCORE_MIN) {
                throw new HttpError(406, 'Por motivos de segurança sua requisição não foi aceita.');
            }
        }
    }
}

module.exports = {
    render: async (req, res, next) => {
        RecaptchaMiddleware.getScript(res)
        next();
    },
    verify: async (req, res, next) => {
        let err = null
        try {            
            await RecaptchaMiddleware.verify(req, res)
        } catch (error) {
            logger.error(error)
            err = error
        }
        next(err)
    },
};
