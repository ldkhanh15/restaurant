import boto3
import botocore


def delete_all_resources(region):
    print(f"\n===============================")
    print(f"🧭 REGION: {region}")
    print(f"===============================")

    session = boto3.Session(region_name=region)
    ec2 = session.client("ec2")
    s3 = session.client("s3")
    sqs = session.client("sqs")
    sns = session.client("sns")
    secrets = session.client("secretsmanager")
    logs = session.client("logs")
    glue = session.client("glue")
    lam = session.client("lambda")

    # -------- EC2 Instances --------
    try:
        instances = ec2.describe_instances()
        ids = [
            i["InstanceId"] for r in instances["Reservations"] for i in r["Instances"]
        ]
        if ids:
            print(f"🧱 EC2: terminating {len(ids)} instance(s)...")
            ec2.terminate_instances(InstanceIds=ids)
    except botocore.exceptions.ClientError:
        pass

    # -------- Volumes --------
    try:
        vols = ec2.describe_volumes()["Volumes"]
        for v in vols:
            print(f"💾 Deleting Volume {v['VolumeId']}")
            ec2.delete_volume(VolumeId=v["VolumeId"])
    except botocore.exceptions.ClientError:
        pass

    # -------- Snapshots --------
    try:
        snaps = ec2.describe_snapshots(OwnerIds=["self"])["Snapshots"]
        for s in snaps:
            print(f"📸 Deleting Snapshot {s['SnapshotId']}")
            ec2.delete_snapshot(SnapshotId=s["SnapshotId"])
    except botocore.exceptions.ClientError:
        pass

    # -------- Elastic IPs --------
    try:
        eips = ec2.describe_addresses()["Addresses"]
        for e in eips:
            print(f"🌐 Releasing Elastic IP {e['AllocationId']}")
            ec2.release_address(AllocationId=e["AllocationId"])
    except botocore.exceptions.ClientError:
        pass

    # -------- S3 Buckets (Global but region-aware) --------
    try:
        s3_global = boto3.client("s3")
        buckets = s3_global.list_buckets().get("Buckets", [])
        for b in buckets:
            name = b["Name"]
            print(f"🪣 Deleting S3 bucket {name}")
            s3_resource = boto3.resource("s3")
            bucket = s3_resource.Bucket(name)
            bucket.objects.all().delete()
            try:
                bucket.object_versions.all().delete()
            except Exception:
                pass
            try:
                bucket.delete()
            except Exception as e:
                print(f"⚠️ Cannot delete bucket {name}: {e}")
    except Exception:
        pass

    # -------- SQS --------
    try:
        for q in sqs.list_queues().get("QueueUrls", []):
            print(f"📬 Deleting SQS queue {q}")
            sqs.delete_queue(QueueUrl=q)
    except botocore.exceptions.ClientError:
        pass

    # -------- SNS --------
    try:
        for t in sns.list_topics().get("Topics", []):
            print(f"📢 Deleting SNS topic {t['TopicArn']}")
            sns.delete_topic(TopicArn=t["TopicArn"])
    except botocore.exceptions.ClientError:
        pass

    # -------- Secrets Manager --------
    try:
        for s in secrets.list_secrets().get("SecretList", []):
            print(f"🔐 Deleting secret {s['Name']}")
            secrets.delete_secret(SecretId=s["ARN"], ForceDeleteWithoutRecovery=True)
    except botocore.exceptions.ClientError:
        pass

    # -------- Lambda --------
    try:
        for f in lam.list_functions().get("Functions", []):
            print(f"⚡ Deleting Lambda function {f['FunctionName']}")
            lam.delete_function(FunctionName=f["FunctionName"])
    except botocore.exceptions.ClientError:
        pass

    # -------- Glue --------
    try:
        for c in glue.list_crawlers().get("CrawlerNames", []):
            print(f"🧬 Deleting Glue Crawler {c}")
            glue.delete_crawler(Name=c)
        for j in glue.list_jobs().get("JobNames", []):
            print(f"🧪 Deleting Glue Job {j}")
            glue.delete_job(JobName=j)
    except botocore.exceptions.ClientError:
        pass

    # -------- CloudWatch Logs --------
    try:
        for lg in logs.describe_log_groups().get("logGroups", []):
            print(f"📈 Deleting log group {lg['logGroupName']}")
            logs.delete_log_group(logGroupName=lg["logGroupName"])
    except botocore.exceptions.ClientError:
        pass

    print(f"✅ Region {region} cleaned.")


def clean_all_regions():
    session = boto3.Session()
    regions = session.get_available_regions("ec2")
    print(f"🌍 Tổng số region phát hiện: {len(regions)}")
    for region in regions:
        try:
            delete_all_resources(region)
        except Exception as e:
            print(f"⚠️ Lỗi khi xử lý {region}: {e}")


if __name__ == "__main__":
    print("🚨 CẢNH BÁO: Script này sẽ xóa toàn bộ tài nguyên AWS ở mọi region!")
    confirm = input("Nhập 'YES' để tiếp tục: ")
    if confirm == "YES":
        clean_all_regions()
    else:
        print("❌ Hủy thao tác.")
