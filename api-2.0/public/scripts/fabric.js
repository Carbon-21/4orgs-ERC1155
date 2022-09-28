//var FabricNetwork = require("fabric-network");
const {Client, User, Endorser, DiscoveryService, Discoverer, Committer} = require('fabric-common');
const crypto = require("crypto");

// const channelName = 'mychannel';
// const orgName = 'Carbon';
// const channel = null;
// const idx = null;


window.setupNetworkConfig = async (username, channelName) => {
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

        // Committer Objects
        const newCommitter1 = new Committer("orderer.example.com", client, "OrdererMSP");
        const newCommitter1Endpoint = client.newEndpoint({
            url: 'grpcs://localhost:7050',
            pem : '-----BEGIN CERTIFICATE-----\n\
            MIICszCCAlqgAwIBAgIUFMsR+XivU7B/ZFSvKnuvehNgwuYwCgYIKoZIzj0EAwIw\n\
            aDELMAkGA1UEBhMCVVMxFzAVBgNVBAgTDk5vcnRoIENhcm9saW5hMRQwEgYDVQQK\n\
            EwtIeXBlcmxlZGdlcjEPMA0GA1UECxMGRmFicmljMRkwFwYDVQQDExBmYWJyaWMt\n\
            Y2Etc2VydmVyMB4XDTIyMDkyNDEyMTcwMFoXDTIzMDkyNDEyMjIwMFowYDELMAkG\n\
            A1UEBhMCVVMxFzAVBgNVBAgTDk5vcnRoIENhcm9saW5hMRQwEgYDVQQKEwtIeXBl\n\
            cmxlZGdlcjEQMA4GA1UECxMHb3JkZXJlcjEQMA4GA1UEAxMHb3JkZXJlcjBZMBMG\n\
            ByqGSM49AgEGCCqGSM49AwEHA0IABFQUJ5X7ZZz+0Tz/rZvWOhpK3K+LFS+jAZEu\n\
            npvpsusNvq2epRlOw24ZDn4vPfnUILcKS49i/xfCcNZ4C2TkV6ejgekwgeYwDgYD\n\
            VR0PAQH/BAQDAgeAMAwGA1UdEwEB/wQCMAAwHQYDVR0OBBYEFD/KQfvR5RlC1xay\n\
            bEKG7LhT+nyaMB8GA1UdIwQYMBaAFGedlZT74yu5tmmgvsrr2P1yaocOMCkGA1Ud\n\
            EQQiMCCCE29yZGVyZXIuZXhhbXBsZS5jb22CCWxvY2FsaG9zdDBbBggqAwQFBgcI\n\
            AQRPeyJhdHRycyI6eyJoZi5BZmZpbGlhdGlvbiI6IiIsImhmLkVucm9sbG1lbnRJ\n\
            RCI6Im9yZGVyZXIiLCJoZi5UeXBlIjoib3JkZXJlciJ9fTAKBggqhkjOPQQDAgNH\n\
            ADBEAiAu+DBNEunCd2qBqW6WKsJ3DGBtp+SVrzyPCjhew6J4UQIgA5Bsa4wWah2O\n\
            ABgyfSxaflwArAqFWdeB0fbP5522dhg=\n\
            -----END CERTIFICATE-----',
            "ssl-target-name-override" : 'orderer.example.com',
            requestTimeout: 3000
        });

        newCommitter1.setEndpoint(newCommitter1Endpoint);
        await newCommitter1.connect();
        console.log("Committer Connection Status: ", await newCommitter1.checkConnection())

        const newCommitter2 = new Committer("orderer2.example.com", client, "OrdererMSP");
        const newCommitter2Endpoint = client.newEndpoint({
            url: 'grpcs://localhost:8050',
            pem : '-----BEGIN CERTIFICATE-----\n\
            MIICtjCCAl2gAwIBAgIUG1Pot24vnwarenqNxGIwLBSHCzMwCgYIKoZIzj0EAwIw\n\
            aDELMAkGA1UEBhMCVVMxFzAVBgNVBAgTDk5vcnRoIENhcm9saW5hMRQwEgYDVQQK\n\
            EwtIeXBlcmxlZGdlcjEPMA0GA1UECxMGRmFicmljMRkwFwYDVQQDExBmYWJyaWMt\n\
            Y2Etc2VydmVyMB4XDTIyMDkyNDEyMTcwMFoXDTIzMDkyNDEyMjIwMFowYTELMAkG\n\
            A1UEBhMCVVMxFzAVBgNVBAgTDk5vcnRoIENhcm9saW5hMRQwEgYDVQQKEwtIeXBl\n\
            cmxlZGdlcjEQMA4GA1UECxMHb3JkZXJlcjERMA8GA1UEAxMIb3JkZXJlcjIwWTAT\n\
            BgcqhkjOPQIBBggqhkjOPQMBBwNCAAQXuhlbjm91zgFEabS/WzTCqirmYsIko+So\n\
            HnZLbHoyO9I9ZqKolz04JWyK8rqOH3FrVxSQ9J88JHLlHyFAbufzo4HrMIHoMA4G\n\
            A1UdDwEB/wQEAwIHgDAMBgNVHRMBAf8EAjAAMB0GA1UdDgQWBBRhLy7dk0YVi6eh\n\
            qGfX6IeNSxk64DAfBgNVHSMEGDAWgBRnnZWU++MrubZpoL7K69j9cmqHDjAqBgNV\n\
            HREEIzAhghRvcmRlcmVyMi5leGFtcGxlLmNvbYIJbG9jYWxob3N0MFwGCCoDBAUG\n\
            BwgBBFB7ImF0dHJzIjp7ImhmLkFmZmlsaWF0aW9uIjoiIiwiaGYuRW5yb2xsbWVu\n\
            dElEIjoib3JkZXJlcjIiLCJoZi5UeXBlIjoib3JkZXJlciJ9fTAKBggqhkjOPQQD\n\
            AgNHADBEAiAG5M4SsnXuupliXCH3LWVesmwbiGQk0WDdTotKHGlNzAIgE94Udu0Z\n\
            ivvvT1l61V90U7UBOeSkw1Vd9Nwck7y7Xt4=\n\
            -----END CERTIFICATE-----',
            "ssl-target-name-override" : 'orderer2.example.com',
            requestTimeout: 3000
        });

        newCommitter2.setEndpoint(newCommitter2Endpoint);
        await newCommitter2.connect();
        console.log("Committer Connection Status: ", await newCommitter2.checkConnection())

        const newCommitter3 = new Committer("orderer3.example.com", client, "OrdererMSP");
        const newCommitter3Endpoint = client.newEndpoint({
            url: 'grpcs://localhost:9050',
            pem : '-----BEGIN CERTIFICATE-----\n\
            MIICtzCCAl2gAwIBAgIUGSCmjIFw91rhSWfLWpZ4PVrrrkMwCgYIKoZIzj0EAwIw\n\
            aDELMAkGA1UEBhMCVVMxFzAVBgNVBAgTDk5vcnRoIENhcm9saW5hMRQwEgYDVQQK\n\
            EwtIeXBlcmxlZGdlcjEPMA0GA1UECxMGRmFicmljMRkwFwYDVQQDExBmYWJyaWMt\n\
            Y2Etc2VydmVyMB4XDTIyMDkyNDEyMTcwMFoXDTIzMDkyNDEyMjIwMFowYTELMAkG\n\
            A1UEBhMCVVMxFzAVBgNVBAgTDk5vcnRoIENhcm9saW5hMRQwEgYDVQQKEwtIeXBl\n\
            cmxlZGdlcjEQMA4GA1UECxMHb3JkZXJlcjERMA8GA1UEAxMIb3JkZXJlcjMwWTAT\n\
            BgcqhkjOPQIBBggqhkjOPQMBBwNCAATOL5gv1Qa1GHZgd9L4J8iDkLxFvgK5oDtR\n\
            9m+Au6CWQAVq+g1WBmshXRR5NX5aYzNYDdQ3v5/dahwCWOcUP8Umo4HrMIHoMA4G\n\
            A1UdDwEB/wQEAwIHgDAMBgNVHRMBAf8EAjAAMB0GA1UdDgQWBBQlnxdGp3t88rHP\n\
            LYAD136fwvvedTAfBgNVHSMEGDAWgBRnnZWU++MrubZpoL7K69j9cmqHDjAqBgNV\n\
            HREEIzAhghRvcmRlcmVyMy5leGFtcGxlLmNvbYIJbG9jYWxob3N0MFwGCCoDBAUG\n\
            BwgBBFB7ImF0dHJzIjp7ImhmLkFmZmlsaWF0aW9uIjoiIiwiaGYuRW5yb2xsbWVu\n\
            dElEIjoib3JkZXJlcjMiLCJoZi5UeXBlIjoib3JkZXJlciJ9fTAKBggqhkjOPQQD\n\
            AgNIADBFAiEAqQzGCEr9x1ZydzqVCVb6XQ5/BpctH5wp+V7f5+IDik8CIFqZpD2G\n\
            dh4rI1IERV2CED87nLV2kR4yRK2BHjrqzXk7\n\
            -----END CERTIFICATE-----',
            "ssl-target-name-override" : 'orderer3.example.com',
            requestTimeout: 3000
        });

        newCommitter3.setEndpoint(newCommitter3Endpoint);
        await newCommitter3.connect();
        console.log("Committer Connection Status: ", await newCommitter3.checkConnection())

        return {
            channel: channel,
            idx: idx,
            endorsers: [
                peer0CarbonEndorser,
                peer0UsersEndorser,
                peer0IbamaEndorser,
                peer0CetesbEndorser
            ],
            commiters: [
                newCommitter1,
                newCommitter2,
                newCommitter3
            ]
        }
}

// window.GenerateTransactionProposal = async (channel, idx, build_options) => {
//     // Creating Proposal
//     const endorsement = channel.newEndorsement("basic");
//     // const build_options = {fcn: 'ClientAccountBalance', args: ['asset2', 'Kavin']};
//     const proposalBytes = endorsement.build(idx, build_options);
//     const hash = crypto.createHash("sha256").update(proposalBytes).digest("hex");

//     return {endorsement: endorsement, hash: hash};
// }

// window.signTransaction = async function(digest, privateKeyPEM){
//     console.log('entrou signtransaction')
//     //const { prvKeyHex } = KEYUTIL.getKey(privateKeyPEM); // convert the pem encoded key to hex encoded private key
//     let prvKeyHex = await KEYUTIL.getKeyFromPlainPrivatePKCS8PEM(privateKeyPEM);
//     console.log('prvKeyHex ',prvKeyHex)
//     const EC = elliptic.ec;
//     const ecdsaCurve = elliptic.curves['p256'];
//     const ecdsa2 = new EC(ecdsaCurve);
//     const signKey = await ecdsa2.keyFromPrivate(prvKeyHex.prvKeyHex, 'hex');
//     const sig = await ecdsa2.sign(Buffer.from(digest, 'hex'), signKey);
  
//     // now we have the signature, next we should send the signed transaction proposal to the peer
//     const signature = Buffer.from(sig.toDER());
//     return signature;
//   }

// window.sendTransaction = async function(endorsement, signature, idx, endorsers, committers) {
//     // Final - Sending Proposal Request
//     endorsement.sign(signature);
//     const proposalResponses = await endorsement.send({targets : endorsers});
//     console.log(proposalResponses.responses);

//     // Commit the Transaction
//     const commitReq  = endorsement.newCommit();
//     commitReq.build(idx);
//     commitReq.sign(idx);
//     const res = await commitReq.send({targets : committers});

//     console.log("Commit Result: ", res)

// }

// window.execute = async function(){
//     console.log('inicio main')
//     let networkConfig = await window.setupNetworkConfig("p", "mychannel");
//     let proposal = await window.GenerateTransactionProposal(networkConfig.channel, networkConfig.idx, {fcn: 'ClientAccountBalance', args: ["$ylvas"]});
//     let privateKeyPEM = 
//         "-----BEGIN PRIVATE KEY-----\n\
//         MIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQghryhRdhaPR8dWCdfuTGDICrz7GQfNEP+SZXirr1cMw6hRANCAATGHzRs2N8LlhUzkK/G63z7mw/qrVulvoZ7EHumjG+iGQwcvh8iviL4Zo3YTpcczHSL0ZbWAXTGdTErpDYI7pOs\n\
//         -----END PRIVATE KEY-----"
//     let signature = await window.signTransaction(proposal.hash, privateKeyPEM);
//     await window.sendTransaction(proposal.endorsement, signature, networkConfig.idx, networkConfig.endorsers, networkConfig.committers)
//     console.log('fim main')
// }

// execute()

