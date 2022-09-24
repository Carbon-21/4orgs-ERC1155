var FabricNetwork = require("fabric-network");
const {Client, User, Endorser, DiscoveryService, Discoverer, Committer} = require('fabric-common');
const crypto = require("crypto");

const channelName = 'mychannel';
const orgName = 'Carbon';
const channel = null;
const idx = null;


window.setupNetworkConfig = async (username) => {
    //user: p
    let userCertificate =
        "-----BEGIN CERTIFICATE-----\n\
        MIICczCCAhqgAwIBAgIURBmdnZAKsS55apNGANCWcaQ33gEwCgYIKoZIzj0EAwIw\n\
        aDELMAkGA1UEBhMCVVMxFzAVBgNVBAgTDk5vcnRoIENhcm9saW5hMRQwEgYDVQQK\n\
        EwtIeXBlcmxlZGdlcjEPMA0GA1UECxMGRmFicmljMRkwFwYDVQQDExBmYWJyaWMt\n\
        Y2Etc2VydmVyMB4XDTIyMDkyNDEyMjQwMFoXDTIzMDkyNDEyMjkwMFowQDEyMA0G\n\
        A1UECxMGY2xpZW50MA0GA1UECxMGY2FyYm9uMBIGA1UECxMLZGVwYXJ0bWVudDEx\n\
        CjAIBgNVBAMTAXAwWTATBgcqhkjOPQIBBggqhkjOPQMBBwNCAASYj0oKJYog9BbK\n\
        gVEo1fACEyOWCpxgMCfeUSWGnlojaW/Te6Gu6Q2AmnktMTxBYxV6TJ7PgGSciaJ1\n\
        5202wHtDo4HJMIHGMA4GA1UdDwEB/wQEAwIHgDAMBgNVHRMBAf8EAjAAMB0GA1Ud\n\
        DgQWBBQiMHmP22fSoBnIBF7Y6WcJR/oPWDAfBgNVHSMEGDAWgBTJgOxA6iFDLMp+\n\
        OrsmE/IE1DyxujBmBggqAwQFBgcIAQRaeyJhdHRycyI6eyJoZi5BZmZpbGlhdGlv\n\
        biI6ImNhcmJvbi5kZXBhcnRtZW50MSIsImhmLkVucm9sbG1lbnRJRCI6InAiLCJo\n\
        Zi5UeXBlIjoiY2xpZW50In19MAoGCCqGSM49BAMCA0cAMEQCIDd50vFkCS3YcRCH\n\
        Va7uzVS+9C3OEENn00ZlvJePqackAiArcj56ytkC1w6y82whE40Abr22vu6S7oXB\n\
        IHxgZC0D1Q==\n\
        -----END CERTIFICATE-----";

    let privateKeyPEM = 
        "-----BEGIN PRIVATE KEY-----\n\
        MIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQghryhRdhaPR8dWCdfuTGDICrz7GQfNEP+SZXirr1cMw6hRANCAATGHzRs2N8LlhUzkK/G63z7mw/qrVulvoZ7EHumjG+iGQwcvh8iviL4Zo3YTpcczHSL0ZbWAXTGdTErpDYI7pOs\n\
        -----END PRIVATE KEY-----"

    //let secret = "iMPXywpoYKhh";
    let secret = username + "pw";

    const client = new Client(username);
    channel = client.newChannel(channelName);
    const user = User.createUser(username, secret, orgName, userCertificate, privateKeyPEM);
    idx = client.newIdentityContext(user);

    const discoverer = new Discoverer("peer0", client, "CarbonMSP");
        const endpoint = client.newEndpoint({
            url: 'grpcs://localhost:7051',
            pem : '-----BEGIN CERTIFICATE-----\n\
            MIICFjCCAb2gAwIBAgIUFoWuemGWRKJMGe+18aCZU/6HQSEwCgYIKoZIzj0EAwIw\n\
            aDELMAkGA1UEBhMCVVMxFzAVBgNVBAgTDk5vcnRoIENhcm9saW5hMRQwEgYDVQQK\n\
            EwtIeXBlcmxlZGdlcjEPMA0GA1UECxMGRmFicmljMRkwFwYDVQQDExBmYWJyaWMt\n\
            Y2Etc2VydmVyMB4XDTIyMDkxMDEyNTgwMFoXDTM3MDkwNjEyNTgwMFowaDELMAkG\n\
            A1UEBhMCVVMxFzAVBgNVBAgTDk5vcnRoIENhcm9saW5hMRQwEgYDVQQKEwtIeXBl\n\
            cmxlZGdlcjEPMA0GA1UECxMGRmFicmljMRkwFwYDVQQDExBmYWJyaWMtY2Etc2Vy\n\
            dmVyMFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEobVIaxRm7ftKjd0e7URjussc\n\
            VSWzhImKoiN3qObYkH3yQAbRaFIfkNrgGBEhGZ1pSv9f0btzFWBl12QnWx94OaNF\n\
            MEMwDgYDVR0PAQH/BAQDAgEGMBIGA1UdEwEB/wQIMAYBAf8CAQEwHQYDVR0OBBYE\n\
            FMmA7EDqIUMsyn46uyYT8gTUPLG6MAoGCCqGSM49BAMCA0cAMEQCIAHwFPVWlpBw\n\
            kLjSaSD4RsjSSL1INm534jVMn/vdYu36AiBqPexkSdCxbOBXeeJOFrfMgfEQnLks\n\
            Tcs1tDgkIe3d4g==\n\
            -----END CERTIFICATE-----',
            "ssl-target-name-override" : 'peer0.carbon.example.com',
            requestTimeout: 3000
        });
        discoverer.setEndpoint(endpoint);
        // await discoverer.connect()

        const discovery = new DiscoveryService("basic", channel);
        // const endorsement1 = channel.newEndorsement("basic");
        // discovery.build(idx, {endorsement: endorsement1});
        discovery.build(idx);
        discovery.sign(idx);

        const discovery_results = await discovery.send({targets: [discoverer], asLocalhost: true});
        console.log(JSON.stringify(discovery_results))

        // Endorserer Objects
        const peer0CarbonEndorser = new Endorser("peer0.carbon.example.com", client, "CarbonMSP");
        const peer0CarbonEndpoint = client.newEndpoint({
            url: 'grpcs://localhost:7051',
            pem : '-----BEGIN CERTIFICATE-----\n\
            MIICFjCCAb2gAwIBAgIUFoWuemGWRKJMGe+18aCZU/6HQSEwCgYIKoZIzj0EAwIw\n\
            aDELMAkGA1UEBhMCVVMxFzAVBgNVBAgTDk5vcnRoIENhcm9saW5hMRQwEgYDVQQK\n\
            EwtIeXBlcmxlZGdlcjEPMA0GA1UECxMGRmFicmljMRkwFwYDVQQDExBmYWJyaWMt\n\
            Y2Etc2VydmVyMB4XDTIyMDkxMDEyNTgwMFoXDTM3MDkwNjEyNTgwMFowaDELMAkG\n\
            A1UEBhMCVVMxFzAVBgNVBAgTDk5vcnRoIENhcm9saW5hMRQwEgYDVQQKEwtIeXBl\n\
            cmxlZGdlcjEPMA0GA1UECxMGRmFicmljMRkwFwYDVQQDExBmYWJyaWMtY2Etc2Vy\n\
            dmVyMFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEobVIaxRm7ftKjd0e7URjussc\n\
            VSWzhImKoiN3qObYkH3yQAbRaFIfkNrgGBEhGZ1pSv9f0btzFWBl12QnWx94OaNF\n\
            MEMwDgYDVR0PAQH/BAQDAgEGMBIGA1UdEwEB/wQIMAYBAf8CAQEwHQYDVR0OBBYE\n\
            FMmA7EDqIUMsyn46uyYT8gTUPLG6MAoGCCqGSM49BAMCA0cAMEQCIAHwFPVWlpBw\n\
            kLjSaSD4RsjSSL1INm534jVMn/vdYu36AiBqPexkSdCxbOBXeeJOFrfMgfEQnLks\n\
            Tcs1tDgkIe3d4g==\n\
            -----END CERTIFICATE-----',
            "ssl-target-name-override" : 'peer0.carbon.example.com',
            requestTimeout: 3000
        });

        peer0CarbonEndorser.setEndpoint(peer0CarbonEndpoint);
        await peer0CarbonEndorser.connect();
        console.log("peer0CarbonEndorser status: ", await peer0CarbonEndorser.checkConnection());

        const peer0UsersEndorser = new Endorser("peer0.users.example.com", client, "UsersMSP");
        const peer0UsersEndpoint = client.newEndpoint({
            url: 'grpcs://localhost:9051',
            pem : '-----BEGIN CERTIFICATE-----\n\
            MIICFjCCAb2gAwIBAgIUCtq8VFTXR/Nn9p59+1ANtzF+HBkwCgYIKoZIzj0EAwIw\n\
            aDELMAkGA1UEBhMCVVMxFzAVBgNVBAgTDk5vcnRoIENhcm9saW5hMRQwEgYDVQQK\n\
            EwtIeXBlcmxlZGdlcjEPMA0GA1UECxMGRmFicmljMRkwFwYDVQQDExBmYWJyaWMt\n\
            Y2Etc2VydmVyMB4XDTIyMDkxMDEyNTgwMFoXDTM3MDkwNjEyNTgwMFowaDELMAkG\n\
            A1UEBhMCVVMxFzAVBgNVBAgTDk5vcnRoIENhcm9saW5hMRQwEgYDVQQKEwtIeXBl\n\
            cmxlZGdlcjEPMA0GA1UECxMGRmFicmljMRkwFwYDVQQDExBmYWJyaWMtY2Etc2Vy\n\
            dmVyMFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEr89Uxx1HSYVsjb+ORetfGzlB\n\
            +tjVEBKujkl50Ru+leg4DRksjZVASFd+OTJhbPszMUMIG05NRiMdMlDJU2ktDaNF\n\
            MEMwDgYDVR0PAQH/BAQDAgEGMBIGA1UdEwEB/wQIMAYBAf8CAQEwHQYDVR0OBBYE\n\
            FMRKfGw5O/T0mh75U5xBVPVvmbKTMAoGCCqGSM49BAMCA0cAMEQCIBwE2oha4a2m\n\
            THZ/FBAwLbOr91xmGtyvGqhifS1v4MZ0AiBRcND6GsOBLmn1xQ+39WnIg9L8VKOa\n\
            atUeBW1WY4MRZA==\n\
            -----END CERTIFICATE-----',
            "ssl-target-name-override" : 'peer0.users.example.com',
            requestTimeout: 3000
        });

        peer0UsersEndorser.setEndpoint(peer0UsersEndpoint);
        await peer0UsersEndorser.connect();
        console.log("peer0UsersEndorser status: ", await peer0UsersEndorser.checkConnection())


        const peer0CetesbEndorser = new Endorser("peer0.cetesb.example.com", client, "CetesbMSP");
        const peer0CetesbEndpoint = client.newEndpoint({
            url: 'grpcs://localhost:11051',
            pem : '-----BEGIN CERTIFICATE-----\n\
            MIICFzCCAb2gAwIBAgIUJ6fCPZ12AZ4dk3VHx8zw4jEM6lQwCgYIKoZIzj0EAwIw\n\
            aDELMAkGA1UEBhMCVVMxFzAVBgNVBAgTDk5vcnRoIENhcm9saW5hMRQwEgYDVQQK\n\
            EwtIeXBlcmxlZGdlcjEPMA0GA1UECxMGRmFicmljMRkwFwYDVQQDExBmYWJyaWMt\n\
            Y2Etc2VydmVyMB4XDTIyMDkxMDEyNTgwMFoXDTM3MDkwNjEyNTgwMFowaDELMAkG\n\
            A1UEBhMCVVMxFzAVBgNVBAgTDk5vcnRoIENhcm9saW5hMRQwEgYDVQQKEwtIeXBl\n\
            cmxlZGdlcjEPMA0GA1UECxMGRmFicmljMRkwFwYDVQQDExBmYWJyaWMtY2Etc2Vy\n\
            dmVyMFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEBC/NVRsszprucopFQaAN+vtw\n\
            SxnsxFcRK4u6y1e7DV7P1JVAGqwYzskTb/887NKhz5AE+axFSJD6nwkWIlRsaKNF\n\
            MEMwDgYDVR0PAQH/BAQDAgEGMBIGA1UdEwEB/wQIMAYBAf8CAQEwHQYDVR0OBBYE\n\
            FD+UfTxHaEiaY9laKfu6oIf4shZtMAoGCCqGSM49BAMCA0gAMEUCIQD44uQeBErK\n\
            vpMF+i5tzLkC+Y6jc1uNWTVnPEOTjpgjSwIgTLjtO/gqzmdViuTSEbcu7Vb4z/9J\n\
            UzAAZqzjfcO9I8Q=\n\
            -----END CERTIFICATE-----',
            "ssl-target-name-override" : 'peer0.cetesb.example.com',
            requestTimeout: 3000
        });

        peer0CetesbEndorser.setEndpoint(peer0CetesbEndpoint);
        await peer0CetesbEndorser.connect();
        console.log("peer0CetesbEndorser status: ", await peer0CetesbEndorser.checkConnection())

        const peer0IbamaEndorser = new Endorser("peer0.ibama.example.com", client, "IbamaMSP");
        const peer0IbamaEndpoint = client.newEndpoint({
            url: 'grpcs://localhost:13051',
            pem : '-----BEGIN CERTIFICATE-----\n\
            MIICFjCCAb2gAwIBAgIUEJH5ItjicEzWals1V8+jupEP4MowCgYIKoZIzj0EAwIw\n\
            aDELMAkGA1UEBhMCVVMxFzAVBgNVBAgTDk5vcnRoIENhcm9saW5hMRQwEgYDVQQK\n\
            EwtIeXBlcmxlZGdlcjEPMA0GA1UECxMGRmFicmljMRkwFwYDVQQDExBmYWJyaWMt\n\
            Y2Etc2VydmVyMB4XDTIyMDkxMDEyNTgwMFoXDTM3MDkwNjEyNTgwMFowaDELMAkG\n\
            A1UEBhMCVVMxFzAVBgNVBAgTDk5vcnRoIENhcm9saW5hMRQwEgYDVQQKEwtIeXBl\n\
            cmxlZGdlcjEPMA0GA1UECxMGRmFicmljMRkwFwYDVQQDExBmYWJyaWMtY2Etc2Vy\n\
            dmVyMFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEvasfCgvY5BjCpLbMn76p/cPH\n\
            qAgU4WSxrYYSsKF0hFgc5tDHGKXtY2QkBL8cEJD20sxz+bvVAIXX01gQxICchKNF\n\
            MEMwDgYDVR0PAQH/BAQDAgEGMBIGA1UdEwEB/wQIMAYBAf8CAQEwHQYDVR0OBBYE\n\
            FMF3mcXb6rs+IE2vVlWTa4Ce163FMAoGCCqGSM49BAMCA0cAMEQCIB+CnNTUuYBh\n\
            t19BMO83RJwEGT1iUtp/myuxk/J/lgAGAiAT9FOBEq+iRX+DLZHUuXsZq3nRVl53\n\
            oKtH7S4ZKg8G9Q==\n\
            -----END CERTIFICATE-----',
            "ssl-target-name-override" : 'peer0.ibama.example.com',
            requestTimeout: 3000
        });

        peer0IbamaEndorser.setEndpoint(peer0IbamaEndpoint);
        await peer0IbamaEndorser.connect();
        console.log("peer0IbamaEndorser status: ", await peer0IbamaEndorser.checkConnection());

        //TODO - Create orderer endpoints
}

window.GenerateTransactionProposal = async () => {
    // Creating Proposal
    const endorsement = channel.newEndorsement("basic");
    const build_options = {fcn: 'ClientAccountBalance', args: ['asset2', 'Kavin']};
    const proposalBytes = endorsement.build(idx, build_options);
    const hash = crypto.createHash("sha256").update(proposalBytes).digest("hex");

    return hash;
}

window.signTransaction = async function(digest, privateKeyPEM){
    console.log('entrou signtransaction')
    //const { prvKeyHex } = KEYUTIL.getKey(privateKeyPEM); // convert the pem encoded key to hex encoded private key
    let prvKeyHex = await KEYUTIL.getKeyFromPlainPrivatePKCS8PEM(privateKeyPEM);
    console.log('prvKeyHex ',prvKeyHex)
    const EC = elliptic.ec;
    const ecdsaCurve = elliptic.curves['p256'];
    const ecdsa2 = new EC(ecdsaCurve);
    const signKey = await ecdsa2.keyFromPrivate(prvKeyHex.prvKeyHex, 'hex');
    const sig = await ecdsa2.sign(Buffer.from(digest, 'hex'), signKey);
  
    // now we have the signature, next we should send the signed transaction proposal to the peer
    const signature = Buffer.from(sig.toDER());
    return signature;
  }
