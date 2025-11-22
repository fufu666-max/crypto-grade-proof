import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  const deployedEncryptedGradeRecord = await deploy("EncryptedGradeRecord", {
    from: deployer,
    log: true,
  });

  console.log(`EncryptedGradeRecord contract: `, deployedEncryptedGradeRecord.address);
};
export default func;
func.id = "deploy_encryptedGradeRecord";
func.tags = ["EncryptedGradeRecord"];
