const upgradeModule = buildModule("UpgradeModule", (m) => {
  const proxyAdminOwner = m.getAccount(0);

  const { proxyAdmin, proxy } = m.useModule(demoModule);

  const demoV2 = m.contract("DemoV2");

  const encodedFunctionCall = m.encodeFunctionCall(demoV2, "setName", [
    "Example Name",
  ]);

  m.call(proxyAdmin, "upgradeAndCall", [proxy, demoV2, encodedFunctionCall], {
    from: proxyAdminOwner,
  });

  return { proxyAdmin, proxy };
});

const demoV2Module = buildModule("DemoV2Module", (m) => {
  const { proxy } = m.useModule(upgradeModule);

  const demo = m.contractAt("DemoV2", proxy);

  return { demo };
});
export default demoV2Module;
