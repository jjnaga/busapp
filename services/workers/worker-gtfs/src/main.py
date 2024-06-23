from datetime import time
import logging
import os
import signal
import sys
from dotenv import load_dotenv
import redis
from gtfs_etl import run_gtfs_etl

# TODO ABSTRACT TO FUNCTION
# Set logging
logging.basicConfig(
    level=logging.INFO,
    format="[%(asctime)s] %(levelname)s - %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)


# TODO ABSTRACT TO FUNCTION
# Load env variables
def load_env_vars():
    load_dotenv()
    env_vars = {
        "REDIS_HOST": os.getenv("REDIS_HOST"),
        "REDIS_PORT": os.getenv("REDIS_PORT"),
        "REDIS_STREAM_NAME": os.getenv("REDIS_STREAM_NAME"),
        "REDIS_CONSUMER_GROUP_NAME": os.getenv("REDIS_CONSUMER_GROUP_NAME"),
        "REDIS_JOB_NAME": os.getenv("REDIS_JOB_NAME"),
    }

    if any(value is None for value in env_vars.values()):
        logging.info("One or more environment variables are not set")
        sys.exit(1)

    return env_vars


def main(
    redis_client: redis.Redis,
    REDIS_STREAM_NAME,
    REDIS_CONSUMER_GROUP_NAME,
    REDIS_JOB_NAME,
):
    shutdown = False

    def signal_handler(signum, frame):
        nonlocal shutdown
        logging.info(f"Received Signal {signum}. Starting graceful shutdown.")
        shutdown = True

    signal.signal(signal.SIGTERM, signal_handler)
    signal.signal(signal.SIGINT, signal_handler)

    while not shutdown:
        try:
            messages = redis_client.xread(
                streams={REDIS_STREAM_NAME: "$"}, count=1, block=1000
            )

            if messages:
                for _, message_list in messages:
                    for message_id, message_data in message_list:
                        logging.info(f"{message_id}: Starting job")
                        job_status = run_gtfs_etl()
                        logging.info(f"{message_id}: Done. Job status: {job_status}")

        except redis.RedisError as e:
            logging.error(f"Redis Error: {e}")
        except Exception as e:
            logging.error(f"Unexpected Error: {e}")
            time.sleep(1)


if __name__ == "__main__":
    logging.info("Starting worker")
    env_vars = load_env_vars()

    redis_client = redis.Redis(
        host=env_vars["REDIS_HOST"], port=env_vars["REDIS_PORT"], decode_responses=True
    )

    main(
        redis_client,
        env_vars["REDIS_STREAM_NAME"],
        env_vars["REDIS_CONSUMER_GROUP_NAME"],
        env_vars["REDIS_JOB_NAME"],
    )

    logging.info("Shutting Down")
