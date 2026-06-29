import os, json, time, sys
import requests

API_KEY = os.environ["ROBLOX_PUBLISH_API_KEY"]
CREATOR_ID = "2771986878"
FBX = "/home/ubuntu/tools/blender3d/cherry_tree.fbx"

url = "https://apis.roblox.com/assets/v1/assets"
req = {"assetType": "Model", "displayName": "CherryBlossomTree_v1",
       "description": "pink cherry blossom tree", "creationContext": {"creator": {"userId": CREATOR_ID}}}
with open(FBX, "rb") as f:
    files = {"request": (None, json.dumps(req), "application/json"),
             "fileContent": ("cherry_tree.fbx", f, "model/fbx")}
    r = requests.post(url, headers={"x-api-key": API_KEY}, files=files)
print("UPLOAD", r.status_code, r.text[:500])
if r.status_code != 200: sys.exit(1)
op_id = r.json()["operationId"]
asset_id = None
for i in range(40):
    time.sleep(2)
    g = requests.get(f"https://apis.roblox.com/assets/v1/operations/{op_id}", headers={"x-api-key": API_KEY})
    d = g.json()
    if d.get("done"):
        asset_id = d["response"]["assetId"]
        print("ASSET_ID", asset_id, "moderation", d["response"].get("moderationResult"))
        break
    print("poll", i, d.get("done"))
if not asset_id: sys.exit(1)
open("/home/ubuntu/tools/blender3d/cherry_asset_id.txt", "w").write(str(asset_id))
print("SAVED", asset_id)
