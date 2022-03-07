import { Contract, providers, utils } from "ethers";
import Head from "next/head";
import { useState, useRef, useEffect } from "react";
import Web3Modal from "web3modal";
import styles from "../styles/Home.module.css";
import { NFT_CONRACT_ADDRESS, abi } from "./constants";

export default function Home() {
  const [walletConnected, setWalletConneted] = useState(false);
  const [presaleStarted, setPresaleStarted] = useState(false);
  const [presaleEnded, setPresaleEnded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [tokenIdsMinted, setTokenIdsMinted] = useState(0);

  const web3ModalRef = useRef();

  const connectWallet = async () => {
    try {
      await getProviderOrSigner();
      setWalletConneted(true);
    } catch (error) {
      console.log(error);
    }
  };

  const getProviderOrSigner = async (needSigner = false) => {
    // if (!web3ModalRef?.current) {
    //   web3ModalRef.current = new Web3Modal({
    //     network: "rinkeby",
    //     providerOptions: {},
    //     disableInjectedProvider: false,
    //   });
    // }
    // connect to Metamask
    // Since we store `web3modal` as a referene, we need to acccess the `current` value to get access the underlying object
    const provider = await (web3ModalRef.current as any).connect();
    const web3Provider = new providers.Web3Provider(provider);

    const { chainId } = await web3Provider.getNetwork();
    if (chainId !== 4) {
      window.alert("Change the network to Rinkeby");
      throw new Error("Change the network to Rinkeby");
    }

    if (needSigner) {
      const signer = web3Provider.getSigner();

      return signer;
    }

    return web3Provider;
  };

  /** Mint an NFT during presale */
  const presaleMint = async () => {
    try {
      const signer = await getProviderOrSigner(true);

      // Create a new instance of the contract with a signer which allows us to sign transactions
      const whitelistContract = new Contract(NFT_CONRACT_ADDRESS, abi, signer);

      // call presale ming from the contract
      const tx = await whitelistContract.presaleMint({
        // value signifies the value of 1 nft
        value: utils.parseEther("0.01"),
      });
      setLoading(true);

      // Wait for the transaction to be mined
      await tx.wait();
      setLoading(false);

      window.alert("NFT minted successfully");
    } catch (error) {
      console.log(error);
    }
  };

  /**Mint nft after presale */
  const publicMint = async () => {
    try {
      const signer = await getProviderOrSigner(true);

      const whitelistContract = new Contract(NFT_CONRACT_ADDRESS, abi, signer);

      const tx = await whitelistContract.publicMint({
        value: utils.parseEther("0.01"),
      });

      setLoading(true);
      await tx.wait();
      setLoading(false);
      window.alert("NFT minted successfully");
    } catch (error) {
      console.log(error);
    }
  };

  /** Start the presale */
  const startPresale = async () => {
    try {
      const signer = await getProviderOrSigner(true);

      const whitelistContract = new Contract(NFT_CONRACT_ADDRESS, abi, signer);

      const tx = await whitelistContract.startPresale();
      setLoading(true);
      await tx.wait();
      setLoading(false);
      await checkIfPresaleStarted();
    } catch (error) {
      console.log(error);
    }
  };

  /** Check if presale started */
  const checkIfPresaleStarted = async () => {
    try {
      const provider = await getProviderOrSigner();

      const nftContract = new Contract(NFT_CONRACT_ADDRESS, abi, provider);
      const _presaleStarted = await nftContract.presaleStarted();

      if (!_presaleStarted) {
        await getOwner();
      }
      setPresaleStarted(_presaleStarted);
      return _presaleStarted;
    } catch (error) {
      console.log(error);
      return false;
    }
  };

  const checkIfPresaleEnded = async () => {
    try {
      const provider = await getProviderOrSigner();

      const nftContract = new Contract(NFT_CONRACT_ADDRESS, abi, provider);
      const _presaleEnded = await nftContract.presaleEnded();

      // Use it(less than function) instead of < beacuse _presaleEnded is a bignumber
      const hasEnded = _presaleEnded.lt(Math.floor(Date.now() / 1000));

      if (hasEnded) {
        setPresaleEnded(true);
      } else {
        setPresaleEnded(false);
      }

      return hasEnded;
    } catch (error) {
      console.log(error);
      return false;
    }
  };

  const getOwner = async () => {
    try {
      const provider = await getProviderOrSigner();

      const nftContract = new Contract(NFT_CONRACT_ADDRESS, abi, provider);

      const _owner = await nftContract.owner();

      // signer will be used to extract the address of the currently connected wallet
      const signer = (await getProviderOrSigner(
        true
      )) as providers.JsonRpcSigner;

      const address = await signer.getAddress();

      if (address.toLocaleLowerCase() === _owner.toLocaleLowerCase())
        return setIsOwner(true);
    } catch (error) {
      console.log(error);
    }
  };

  /** get the number of token ids that have been minted */
  const getTokenIdsMinted = async () => {
    try {
      const provider = await getProviderOrSigner(true);
      const nftContract = new Contract(NFT_CONRACT_ADDRESS, abi, provider);

      const _tokenIds = await nftContract.tokenIds();

      setTokenIdsMinted(_tokenIds.toString());
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    if (!walletConnected) {
      // Assign the Web3Modal class to the reference object by setting its `current` value. (persisted)
      (web3ModalRef.current as any) = new Web3Modal({
        network: "rinkeby",
        providerOptions: {},
        disableInjectedProvider: false,
      });

      connectWallet();

      // Check if presale has started and ended
      const checkPresale = async () => {
        const _presaleStarted = await checkIfPresaleStarted();
        if (_presaleStarted) return checkIfPresaleStarted();
      };

      checkPresale();

      getTokenIdsMinted();

      // Set an interval which gets called every 5s to check presale has ended
      const presaleEndedInterval = setInterval(async () => {
        const _presaleStarted = await checkIfPresaleStarted();
        if (_presaleStarted) {
          const _presaleEnded = await checkIfPresaleEnded();

          if (_presaleEnded) {
            clearInterval(presaleEndedInterval);
          }
        }
      }, 5 * 1000);

      // Set interval to get the number of token ids minted every 5 seconds
      setInterval(async () => {
        await getTokenIdsMinted();
      }, 5 * 1000);
    }
  }, [walletConnected]);

  /** @returns Button according to the state of the DApp */
  const renderButton = () => {
    // if wallet is not connected, return connect wallet button
    if (!walletConnected) {
      return (
        <button onClick={connectWallet} className={styles.button}>
          Connect Wallet
        </button>
      );
    }

    if (loading) {
      return <button className={styles.button}>loading ...</button>;
    }

    // if connected user is presale hasnt started, allow them to start the presale
    if (isOwner && !presaleStarted)
      return (
        <button className={styles.button} onClick={startPresale}>
          Start Presale
        </button>
      );

    if (!presaleStarted)
      return (
        <div>
          <div className={styles.description}>Presale hasnt started</div>
        </div>
      );

    if (presaleStarted && !presaleEnded)
      return (
        <div>
          <div className={styles.description}>
            If Address, is whitelisted, Mint an NFT
          </div>
          <button className={styles.button} onClick={presaleMint}>
            Presale Mint
          </button>
        </div>
      );

    if (presaleStarted && presaleEnded)
      return (
        <button className={styles.button} onClick={publicMint}>
          Public Mint
        </button>
      );
  };

  return (
    <div>
      <Head>
        <title>Wakulima NFT</title>
        <meta name="description" content="Wakulima DAPP" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className={styles.main}>
        <div>
          <h1 className={styles.title}> Welcome to Wakulima</h1>
        </div>
      </div>
    </div>
  );
}
